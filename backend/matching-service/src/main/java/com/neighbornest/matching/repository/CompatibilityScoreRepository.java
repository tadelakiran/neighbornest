package com.neighbornest.matching.repository;

import com.neighbornest.matching.entity.CompatibilityScore;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link CompatibilityScore} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface CompatibilityScoreRepository extends JpaRepository<CompatibilityScore, Long> {

    /**
     * Returns the top scores where the user is the primary user, ordered by
     * overall score descending.
     *
     * @param userId   the user ID
     * @param pageable paging and ordering
     * @return the ordered list of scores
     */
    List<CompatibilityScore> findByUserId1OrderByOverallScoreDesc(Long userId, Pageable pageable);

    /**
     * Returns the top scores where the user is the candidate user, ordered by
     * overall score descending.
     *
     * @param userId   the user ID
     * @param pageable paging and ordering
     * @return the ordered list of scores
     */
    List<CompatibilityScore> findByUserId2OrderByOverallScoreDesc(Long userId, Pageable pageable);

    /**
     * Deletes all scores involving the given user in either orientation.
     *
     * @param userId1 the user ID (as primary user)
     * @param userId2 the same user ID (as candidate user)
     */
    void deleteByUserId1OrUserId2(Long userId1, Long userId2);
}
