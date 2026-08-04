package com.neighbornest.user.repository;

import com.neighbornest.user.entity.OnboardingAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * Spring Data JPA repository for {@link OnboardingAnswer} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface OnboardingAnswerRepository extends JpaRepository<OnboardingAnswer, Long> {

    /**
     * Returns all onboarding answers for a profile, ordered by question key.
     *
     * @param userProfileId the profile ID
     * @return the list of answers
     */
    List<OnboardingAnswer> findByUserProfileIdOrderByQuestionKeyAsc(Long userProfileId);

    /**
     * Returns all onboarding answers for many profiles in one query.
     * <p>
     * Used to avoid the classic N+1 select pattern when assembling responses
     * for a list of profiles (e.g. the match-ready feed).
     * </p>
     *
     * @param userProfileIds the profile IDs
     * @return the list of answers for all requested profiles
     */
    List<OnboardingAnswer> findAllByUserProfileIdIn(Collection<Long> userProfileIds);

    /**
     * Counts the answers recorded for a profile without loading them.
     *
     * @param userProfileId the profile ID
     * @return the number of answers
     */
    long countByUserProfileId(Long userProfileId);

    /**
     * Deletes all answers previously recorded for a profile.
     *
     * @param userProfileId the profile ID
     */
    void deleteByUserProfileId(Long userProfileId);
}
