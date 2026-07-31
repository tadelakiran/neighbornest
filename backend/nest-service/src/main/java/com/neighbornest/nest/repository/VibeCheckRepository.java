package com.neighbornest.nest.repository;

import com.neighbornest.nest.entity.VibeCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link VibeCheck} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface VibeCheckRepository extends JpaRepository<VibeCheck, Long> {

    /**
     * Returns all vibe checks for a nest.
     *
     * @param nestId the nest ID
     * @return the list of vibe checks
     */
    List<VibeCheck> findByNestId(Long nestId);

    /**
     * Finds a member's vibe check for a nest.
     *
     * @param nestId the nest ID
     * @param userId the user profile ID
     * @return the vibe check, if present
     */
    Optional<VibeCheck> findByNestIdAndUserId(Long nestId, Long userId);
}
