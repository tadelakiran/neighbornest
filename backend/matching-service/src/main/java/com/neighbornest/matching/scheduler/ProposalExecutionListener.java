package com.neighbornest.matching.scheduler;

import com.neighbornest.matching.event.ProposalAcceptedEvent;
import com.neighbornest.matching.exception.ServiceUnavailableException;
import com.neighbornest.matching.service.MatchProposalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Executes a fully-accepted proposal after the acceptance transaction commits.
 * <p>
 * Listening on {@code AFTER_COMMIT} keeps the nest-service call outside the
 * acceptance transaction: if the transaction were to roll back, no Nest would
 * be created for a proposal that was never durably accepted. A nest-service
 * outage is logged and left for the explicit {@code /execute} endpoint to
 * retry.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProposalExecutionListener {

    private final MatchProposalService matchProposalService;

    /**
     * Creates the Nest for an accepted proposal after commit.
     *
     * @param event the accepted proposal event
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onProposalAccepted(final ProposalAcceptedEvent event) {
        try {
            matchProposalService.execute(event.proposalId());
        } catch (final ServiceUnavailableException e) {
            // Proposal stays ACCEPTED so the explicit /execute endpoint can retry.
            log.warn("Deferred execution of proposal {} failed: {}", event.proposalId(), e.getMessage());
        }
    }
}
