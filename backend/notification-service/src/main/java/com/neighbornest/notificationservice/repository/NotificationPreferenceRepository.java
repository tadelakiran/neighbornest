package com.neighbornest.notificationservice.repository;

import com.neighbornest.notificationservice.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link NotificationPreference}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

    /**
     * Finds the preference row of a user.
     *
     * @param userId the user's profile id
     * @return the preference if it exists
     */
    Optional<NotificationPreference> findByUserId(Long userId);
}
