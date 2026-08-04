package com.neighbornest.user.repository;

import com.neighbornest.user.entity.BudgetLevel;
import com.neighbornest.user.entity.OnboardingAnswer;
import com.neighbornest.user.entity.SocialGoal;
import com.neighbornest.user.entity.UserProfile;
import com.neighbornest.user.entity.UserRole;
import com.neighbornest.user.entity.WorkType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for {@link UserProfileRepository} using an in-memory H2
 * database ({@link DataJpaTest}).
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("UserProfileRepository DataJpa Tests")
class UserProfileRepositoryTest {

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private OnboardingAnswerRepository onboardingAnswerRepository;

    /**
     * Builds a minimal profile for persistence.
     */
    private UserProfile profile(final Long authUserId, final String city) {
        return UserProfile.builder()
                .authUserId(authUserId)
                .fullName("John Doe")
                .city(city)
                .role(UserRole.NEWCOMER)
                .build();
    }

    @Nested
    @DisplayName("findByAuthUserId method")
    class FindByAuthUserIdTests {

        @Test
        @DisplayName("Should find a profile by its auth user ID")
        void shouldFindByAuthUserId() {
            userProfileRepository.save(profile(1L, "San Francisco"));

            final Optional<UserProfile> found = userProfileRepository.findByAuthUserId(1L);

            assertThat(found).isPresent();
            assertThat(found.get().getFullName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should return empty when the auth user ID does not exist")
        void shouldReturnEmptyForUnknownUser() {
            assertThat(userProfileRepository.findByAuthUserId(999L)).isEmpty();
        }

        @Test
        @DisplayName("Should enforce the unique constraint on auth_user_id")
        void shouldEnforceUniqueAuthUserId() {
            userProfileRepository.save(profile(1L, "San Francisco"));

            final UserProfile duplicate = profile(1L, "New York");

            org.junit.jupiter.api.Assertions.assertThrows(
                    org.springframework.dao.DataIntegrityViolationException.class,
                    () -> userProfileRepository.saveAndFlush(duplicate));
        }
    }

    @Nested
    @DisplayName("existsByAuthUserId method")
    class ExistsByAuthUserIdTests {

        @Test
        @DisplayName("Should return true when a profile exists")
        void shouldReturnTrueWhenExists() {
            userProfileRepository.save(profile(1L, "San Francisco"));

            assertThat(userProfileRepository.existsByAuthUserId(1L)).isTrue();
        }

        @Test
        @DisplayName("Should return false when no profile exists")
        void shouldReturnFalseWhenMissing() {
            assertThat(userProfileRepository.existsByAuthUserId(999L)).isFalse();
        }
    }

    @Nested
    @DisplayName("findAllByIsOnboardedTrue method")
    class FindAllOnboardedTests {

        @Test
        @DisplayName("Should return only onboarded profiles")
        void shouldReturnOnlyOnboardedProfiles() {
            final UserProfile onboarded = profile(1L, "San Francisco");
            onboarded.setOnboarded(true);
            userProfileRepository.save(onboarded);
            userProfileRepository.save(profile(2L, "New York"));

            final List<UserProfile> found = userProfileRepository.findAllByIsOnboardedTrue();

            assertThat(found).hasSize(1);
            assertThat(found.get(0).getAuthUserId()).isEqualTo(1L);
        }
    }

    @Nested
    @DisplayName("findAllByIsOnboardedTrueAndCity method")
    class FindAllOnboardedByCityTests {

        @Test
        @DisplayName("Should filter onboarded profiles by city")
        void shouldFilterByCity() {
            final UserProfile onboardedSf = profile(1L, "San Francisco");
            onboardedSf.setOnboarded(true);
            userProfileRepository.save(onboardedSf);
            final UserProfile onboardedNy = profile(2L, "New York");
            onboardedNy.setOnboarded(true);
            userProfileRepository.save(onboardedNy);
            userProfileRepository.save(profile(3L, "San Francisco"));

            final List<UserProfile> found = userProfileRepository.findAllByIsOnboardedTrueAndCity("San Francisco");

            assertThat(found).hasSize(1);
            assertThat(found.get(0).getAuthUserId()).isEqualTo(1L);
        }
    }

    @Nested
    @DisplayName("findAllReadyForMatch method")
    class FindAllReadyForMatchTests {

        @Test
        @DisplayName("Should return onboarded profiles with goal, budget and answers")
        void shouldReturnOnlyCompleteProfiles() {
            final UserProfile complete = profile(1L, "San Francisco");
            complete.setOnboarded(true);
            complete.setSocialGoal(SocialGoal.FRIENDSHIP);
            complete.setBudgetLevel(BudgetLevel.MEDIUM);
            userProfileRepository.save(complete);

            final UserProfile missingGoal = profile(2L, "San Francisco");
            missingGoal.setOnboarded(true);
            missingGoal.setBudgetLevel(BudgetLevel.HIGH);
            userProfileRepository.save(missingGoal);

            final UserProfile notOnboarded = profile(3L, "San Francisco");
            notOnboarded.setSocialGoal(SocialGoal.NETWORKING);
            notOnboarded.setBudgetLevel(BudgetLevel.LOW);
            userProfileRepository.save(notOnboarded);

            // Only the "complete" profile has onboarding answers
            onboardingAnswerRepository.save(OnboardingAnswer.builder()
                    .userProfileId(complete.getId())
                    .questionKey("values_adventure")
                    .answerValue("5")
                    .weight(3)
                    .build());

            final List<UserProfile> ready = userProfileRepository.findAllReadyForMatch();

            assertThat(ready).hasSize(1);
            assertThat(ready.get(0).getAuthUserId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should return an empty list when nothing qualifies")
        void shouldReturnEmptyWhenNothingQualifies() {
            userProfileRepository.save(profile(1L, "San Francisco"));

            assertThat(userProfileRepository.findAllReadyForMatch()).isEmpty();
        }
    }
}
