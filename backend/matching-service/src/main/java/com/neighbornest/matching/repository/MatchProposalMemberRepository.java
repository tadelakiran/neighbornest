package com.neighbornest.matching.repository;

import com.neighbornest.matching.entity.MatchProposalMember;
import com.neighbornest.matching.entity.ProposalResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link MatchProposalMember} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface MatchProposalMemberRepository extends JpaRepository<MatchProposalMember, Long> {

    /**
     * Returns all members of a proposal.
     *
     * @param proposalId the proposal ID
     * @return the list of members
     */
    List<MatchProposalMember> findByMatchProposalId(Long proposalId);

    /**
     * Finds a specific member within a proposal.
     *
     * @param proposalId the proposal ID
     * @param userId     the user ID
     * @return the member, if present
     */
    Optional<MatchProposalMember> findByMatchProposalIdAndUserId(Long proposalId, Long userId);

    /**
     * Returns all proposals where a user has not yet responded.
     *
     * @param userId   the user ID
     * @param response the pending response status
     * @return the list of pending memberships
     */
    List<MatchProposalMember> findByUserIdAndResponse(Long userId, ProposalResponse response);
}
