package com.neighbornest.matching.service;

import com.neighbornest.matching.client.dto.OnboardingAnswerDto;
import com.neighbornest.matching.client.dto.UserMatchDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link ScoringEngine}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@DisplayName("ScoringEngine Unit Tests")
class ScoringEngineTest {

    private final ScoringEngine scoringEngine = new ScoringEngine();

    private static final ScoringEngine.Weights WEIGHTS =
            new ScoringEngine.Weights(0.40, 0.35, 0.25);

    @Nested
    @DisplayName("Values alignment")
    class ValuesTests {

        @Test
        @DisplayName("Should score 100 when all values answers match")
        void shouldScoreFullWhenValuesMatch() {
            final UserMatchDto a = userWithAnswers(
                    answer("values_adventure", "5", 3),
                    answer("values_family", "4", 2));
            final UserMatchDto b = userWithAnswers(
                    answer("values_adventure", "5", 3),
                    answer("values_family", "4", 2));

            final ScoringEngine.ScoreResult result = scoringEngine.compute(a, b, WEIGHTS);

            assertThat(result.valuesScore()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("Should score 0 when values answers differ")
        void shouldScoreZeroWhenValuesDiffer() {
            final UserMatchDto a = userWithAnswers(answer("values_adventure", "5", 3));
            final UserMatchDto b = userWithAnswers(answer("values_adventure", "1", 3));

            final ScoringEngine.ScoreResult result = scoringEngine.compute(a, b, WEIGHTS);

            assertThat(result.valuesScore()).isEqualTo(0.0);
        }
    }

    @Nested
    @DisplayName("Lifestyle alignment")
    class LifestyleTests {

        @Test
        @DisplayName("Should score 100 when all lifestyle fields match")
        void shouldScoreFullWhenLifestyleMatches() {
            final UserMatchDto a = user("FULL_TIME", "AMBIVERT", "FLEXIBLE", "MEDIUM");
            final UserMatchDto b = user("FULL_TIME", "AMBIVERT", "FLEXIBLE", "MEDIUM");

            final ScoringEngine.ScoreResult result = scoringEngine.compute(a, b, WEIGHTS);

            assertThat(result.lifestyleScore()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("Should score 0 when no lifestyle field matches")
        void shouldScoreZeroWhenNoLifestyleMatch() {
            final UserMatchDto a = user("FULL_TIME", "INTROVERT", "EARLY_BIRD", "LOW");
            final UserMatchDto b = user("STUDENT", "EXTROVERT", "NIGHT_OWL", "HIGH");

            final ScoringEngine.ScoreResult result = scoringEngine.compute(a, b, WEIGHTS);

            assertThat(result.lifestyleScore()).isEqualTo(0.0);
        }
    }

    @Nested
    @DisplayName("Interest overlap")
    class InterestTests {

        @Test
        @DisplayName("Should score 100 for identical interests")
        void shouldScoreFullForIdenticalInterests() {
            final UserMatchDto a = userWithAnswers(
                    answer("interest_hiking", "true", 1),
                    answer("interest_boardgames", "true", 1));
            final UserMatchDto b = userWithAnswers(
                    answer("interest_hiking", "true", 1),
                    answer("interest_boardgames", "true", 1));

            final ScoringEngine.ScoreResult result = scoringEngine.compute(a, b, WEIGHTS);

            assertThat(result.interestScore()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("Should return neutral 50 when both users have no interests")
        void shouldReturnNeutralWhenNoInterests() {
            final UserMatchDto a = userWithAnswers();
            final UserMatchDto b = userWithAnswers();

            final ScoringEngine.ScoreResult result = scoringEngine.compute(a, b, WEIGHTS);

            assertThat(result.interestScore()).isEqualTo(50.0);
        }
    }

    @Nested
    @DisplayName("Dealbreaker penalties")
    class DealbreakerTests {

        @Test
        @DisplayName("Should apply budget penalty when budgets differ by more than one step")
        void shouldApplyBudgetDealbreaker() {
            final UserMatchDto a = user("FULL_TIME", "AMBIVERT", "FLEXIBLE", "LOW");
            final UserMatchDto b = user("FULL_TIME", "AMBIVERT", "FLEXIBLE", "HIGH");

            final ScoringEngine.ScoreResult result = scoringEngine.compute(a, b, WEIGHTS);

            assertThat(result.overallScore())
                    .isLessThan(100.0 - ScoringEngine.BUDGET_DEALBREAKER_PENALTY);
        }

        @Test
        @DisplayName("Should not penalize adjacent budget levels")
        void shouldNotPenalizeAdjacentBudgets() {
            // Lifestyle: schedule=1, personality=1, work=1, budget=0 -> 75
            // Values: both values answers match -> 100
            // Interest: neither has interests -> 50 (neutral)
            // Overall: (100*0.40 + 75*0.35 + 50*0.25) / 1.0 = 78.75, no penalty
            final UserMatchDto a = user(
                    "FULL_TIME", "AMBIVERT", "FLEXIBLE", "LOW",
                    answer("values_adventure", "5", 3));
            final UserMatchDto b = user(
                    "FULL_TIME", "AMBIVERT", "FLEXIBLE", "MEDIUM",
                    answer("values_adventure", "5", 3));

            final ScoringEngine.ScoreResult result = scoringEngine.compute(a, b, WEIGHTS);

            assertThat(result.overallScore()).isCloseTo(78.75, org.assertj.core.data.Offset.offset(0.01));
        }
    }

    @Test
    @DisplayName("Should combine dimensions using configured weights")
    void shouldCombineWithWeights() {
        // Values: both values answers match -> 100
        // Lifestyle: all four fields match -> 100
        // Interest: neither has interests -> 50 (neutral)
        // Overall: (100*0.40 + 100*0.35 + 50*0.25) / 1.0 = 87.5
        final UserMatchDto a = user(
                "FULL_TIME", "AMBIVERT", "FLEXIBLE", "MEDIUM",
                answer("values_adventure", "5", 3));
        final UserMatchDto b = user(
                "FULL_TIME", "AMBIVERT", "FLEXIBLE", "MEDIUM",
                answer("values_adventure", "5", 3));

        final ScoringEngine.ScoreResult result = scoringEngine.compute(a, b, WEIGHTS);

        assertThat(result.overallScore()).isCloseTo(87.5, org.assertj.core.data.Offset.offset(0.01));
    }

    /**
     * Builds a user DTO with lifestyle fields and answers.
     */
    private UserMatchDto user(final String work, final String personality, final String schedule,
                              final String budget, final OnboardingAnswerDto... answers) {
        return UserMatchDto.builder()
                .workType(work)
                .personalityType(personality)
                .schedulePreference(schedule)
                .budgetLevel(budget)
                .onboardingAnswers(List.of(answers))
                .build();
    }

    /**
     * Builds a user DTO with only onboarding answers.
     */
    private UserMatchDto userWithAnswers(final OnboardingAnswerDto... answers) {
        return UserMatchDto.builder()
                .onboardingAnswers(List.of(answers))
                .build();
    }

    /**
     * Builds an onboarding answer DTO.
     */
    private OnboardingAnswerDto answer(final String key, final String value, final int weight) {
        return OnboardingAnswerDto.builder()
                .questionKey(key)
                .answerValue(value)
                .weight(weight)
                .build();
    }
}
