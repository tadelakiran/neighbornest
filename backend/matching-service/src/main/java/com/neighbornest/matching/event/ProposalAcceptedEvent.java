package com.neighbornest.matching.event;

/**
 * Domain event published once every member of a proposal has accepted.
 * <p>
 * Consumed after the enclosing transaction commits so Nest creation in the
 * nest-service never runs inside an uncommitted acceptance transaction (which
 * could otherwise leave an orphaned Nest if the transaction later rolled
 * back).
 * </p>
 *
 * @param proposalId the fully-accepted proposal ID
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record ProposalAcceptedEvent(Long proposalId) {
}
