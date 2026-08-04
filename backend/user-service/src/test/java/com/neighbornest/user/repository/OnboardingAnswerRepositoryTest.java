package com.neighbornest.user.repository;

import com.neighbornest.user.entity.OnboardingAnswer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for {@link OnboardingAnswerRepository} using an in-memory
 * H2 database ({@link DataJpaTest}).
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("OnboardingAnswerRepository DataJpa Tests")
class OnboardingAnswerRepositoryTest {

    @Autowired
    private OnboardingAnswerRepository onboardingAnswerRepository;

    /**
     * Builds an answer for the given profile and question.
     */
    private OnboardingAnswer answer(final Long profileId, final String key, final String value) {
        return OnboardingAnswer.builder()
                .userProfileId(profileId)
                .questionKey(key)
                .answerValue(value)
                .weight(3)
                .build();
    }

    @Nested
    @DisplayName("findByUserProfileIdOrderByQuestionKeyAsc method")
    class FindByProfileTests {

        @Test
        @DisplayName("Should return answers ordered by question key")
        void shouldReturnOrderedAnswers() {
            onboardingAnswerRepository.save(answer(1L, "values_community", "4"));
            onboardingAnswerRepository.save(answer(1L, "values_adventure", "5"));
            onboardingAnswerRepository.save(answer(2L, "interest_hiking", "3"));

            final List<OnboardingAnswer> found = onboardingAnswerRepository
                    .findByUserProfileIdOrderByQuestionKeyAsc(1L);

            assertThat(found).hasSize(2);
            assertThat(found.get(0).getQuestionKey()).isEqualTo("values_adventure");
            assertThat(found.get(1).getQuestionKey()).isEqualTo("values_community");
        }
    }

    @Nested
    @DisplayName("findAllByUserProfileIdIn method")
    class FindAllByProfilesTests {

        @Test
        @DisplayName("Should fetch answers for multiple profiles in one query")
        void shouldFetchAnswersForManyProfiles() {
            onboardingAnswerRepository.save(answer(1L, "values_adventure", "5"));
            onboardingAnswerRepository.save(answer(2L, "interest_hiking", "3"));

            final List<OnboardingAnswer> found =
                    onboardingAnswerRepository.findAllByUserProfileIdIn(List.of(1L, 2L));

            assertThat(found).hasSize(2);
        }
    }

    @Nested
    @DisplayName("countByUserProfileId method")
    class CountByProfileTests {

        @Test
        @DisplayName("Should count the answers recorded for a profile")
        void shouldCountAnswers() {
            onboardingAnswerRepository.save(answer(1L, "values_adventure", "5"));
            onboardingAnswerRepository.save(answer(1L, "interest_hiking", "3"));

            assertThat(onboardingAnswerRepository.countByUserProfileId(1L)).isEqualTo(2L);
            assertThat(onboardingAnswerRepository.countByUserProfileId(2L)).isZero();
        }
    }

    @Nested
    @DisplayName("deleteByUserProfileId method")
    class DeleteByProfileTests {

        @Test
        @DisplayName("Should remove all answers for a profile only")
        void shouldDeleteOnlyTargetProfileAnswers() {
            onboardingAnswerRepository.save(answer(1L, "values_adventure", "5"));
            onboardingAnswerRepository.save(answer(1L, "interest_hiking", "3"));
            onboardingAnswerRepository.save(answer(2L, "interest_cooking", "4"));

            onboardingAnswerRepository.deleteByUserProfileId(1L);

            assertThat(onboardingAnswerRepository.countByUserProfileId(1L)).isZero();
            assertThat(onboardingAnswerRepository.countByUserProfileId(2L)).isEqualTo(1L);
        }
    }
}
