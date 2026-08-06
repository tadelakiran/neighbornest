package com.neighbornest.matching.repository;

import com.neighbornest.matching.entity.MatchProposal;
import com.neighbornest.matching.entity.ProposalStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link MatchProposal} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface MatchProposalRepository extends JpaRepository<MatchProposal, Long> {

    /**
     * Returns all proposals in the given status that expired before the given
     * time (used by the expiry scheduler).
     *
     * @param status the proposal status
     * @param before the cutoff time
     * @return the matching proposals
     */
    List<MatchProposal> findByStatusAndExpiresAtBefore(ProposalStatus status, LocalDateTime before);

    /**
     * Loads a proposal for update, taking a pessimistic write lock so
     * concurrent member responses cannot both read a stale snapshot and leave
     * a fully-accepted proposal stuck in {@code PENDING}.
     *
     * @param id the proposal ID
     * @return the locked proposal, if present
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from MatchProposal p where p.id = :id")
    Optional<MatchProposal> findByIdForUpdate(@Param("id") Long id);
}
