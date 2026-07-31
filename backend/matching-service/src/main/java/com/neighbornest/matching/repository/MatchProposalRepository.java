package com.neighbornest.matching.repository;

import com.neighbornest.matching.entity.MatchProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for {@link MatchProposal} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface MatchProposalRepository extends JpaRepository<MatchProposal, Long> {
}
