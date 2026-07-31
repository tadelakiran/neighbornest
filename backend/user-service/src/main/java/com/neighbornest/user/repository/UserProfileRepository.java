package com.neighbornest.user.repository;

import com.neighbornest.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link UserProfile} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    /**
     * Finds a profile by its linked auth-service user ID.
     *
     * @param authUserId the auth-service user ID
     * @return the matching profile, if present
     */
    Optional<UserProfile> findByAuthUserId(Long authUserId);

    /**
     * Returns all profiles that have completed onboarding.
     *
     * @return list of onboarded profiles
     */
    List<UserProfile> findAllByIsOnboardedTrue();

    /**
     * Returns all onboarded profiles in a given city.
     *
     * @param city the city name
     * @return list of onboarded profiles for the city
     */
    List<UserProfile> findAllByIsOnboardedTrueAndCity(String city);

    /**
     * Returns profiles that are ready for matching: onboarded, have a social
     * goal, a budget level, and at least one onboarding answer recorded.
     *
     * @return list of match-ready profiles
     */
    @Query("SELECT DISTINCT p FROM UserProfile p " +
            "WHERE p.isOnboarded = true " +
            "AND p.socialGoal IS NOT NULL " +
            "AND p.budgetLevel IS NOT NULL " +
            "AND EXISTS (SELECT a FROM OnboardingAnswer a WHERE a.userProfileId = p.id)")
    List<UserProfile> findAllReadyForMatch();

    /**
     * Checks whether a profile exists for the given auth-service user ID.
     *
     * @param authUserId the auth-service user ID
     * @return {@code true} if a profile already exists
     */
    boolean existsByAuthUserId(Long authUserId);
}
