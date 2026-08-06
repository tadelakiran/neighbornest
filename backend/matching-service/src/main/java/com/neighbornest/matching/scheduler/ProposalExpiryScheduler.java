package com.neighbornest.matching.scheduler;

import com.neighbornest.matching.entity.MatchProposal;
import com.neighbornest.matching.entity.ProposalStatus;
import com.neighbornest.matching.repository.MatchProposalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Expires stale pending proposals.
 * <p>
 * Runs daily at midnight and marks every {@code PENDING} proposal whose
 * {@code expiresAt} has passed as {@code EXPIRED}.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProposalExpiryScheduler {

    private final MatchProposalRepository proposalRepository;

    /**
     * Expires all pending proposals whose validity window has passed.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expireExpiredProposals() {
        final List<MatchProposal> expired = proposalRepository
                .findByStatusAndExpiresAtBefore(ProposalStatus.PENDING, LocalDateTime.now());

        if (expired.isEmpty()) {
            return;
        }

        expired.forEach(proposal -> proposal.setStatus(ProposalStatus.EXPIRED));
        proposalRepository.saveAll(expired);
        log.info("Expired {} proposals", expired.size());
    }
}
