package com.neighbornest.matching.entity;

/**
 * Lifecycle status of a Nest formation proposal.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum ProposalStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    EXPIRED,
    /** Proposal fully accepted and a Nest was created for it. */
    COMPLETED
}
