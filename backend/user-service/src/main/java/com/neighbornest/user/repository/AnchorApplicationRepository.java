package com.neighbornest.user.repository;

import com.neighbornest.user.entity.AnchorApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
