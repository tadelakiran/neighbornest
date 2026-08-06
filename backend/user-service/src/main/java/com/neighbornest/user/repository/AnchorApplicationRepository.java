package com.neighbornest.user.repository;

import com.neighbornest.user.entity.AnchorApplication;
import com.neighbornest.user.entity.AnchorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link AnchorApplication} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface AnchorApplicationRepository extends JpaRepository<AnchorApplication, Long> {

    /**
     * Finds the most recent anchor application for a profile.
     *
     * @param userProfileId the profile ID
     * @return the application, if present
     */
    Optional<AnchorApplication> findTopByUserProfileIdOrderByAppliedAtDesc(Long userProfileId);

    /**
     * Returns all applications ordered by most recently applied (admin view).
     *
     * @return all applications
     */
    List<AnchorApplication> findAllByOrderByAppliedAtDesc();

    /**
     * Returns applications filtered by status, most recent first (admin view).
     *
     * @param status the status to filter by
     * @return matching applications
     */
    List<AnchorApplication> findAllByStatusOrderByAppliedAtDesc(AnchorStatus status);

    /**
     * Deletes all applications recorded for a profile.
     * <p>
     * Used when a profile is deleted so no orphaned applications remain.
     * </p>
     *
     * @param userProfileId the profile ID
     */
    void deleteByUserProfileId(Long userProfileId);
}
