package com.neighbornest.matching.service;

import com.neighbornest.matching.client.dto.OnboardingAnswerDto;
import com.neighbornest.matching.client.dto.UserMatchDto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Pure compatibility scoring engine.
 * <p>
 * Computes dimension scores (values, lifestyle, interest) on a 0-100 scale,
 * applies dealbreaker penalties as hard filters, and combines them with the
 * configured weights into an overall score. Stateless and unit-testable.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
public class ScoringEngine {

    /** Prefix used to identify values-based onboarding questions. */
    public static final String VALUES_PREFIX = "values_";

    /** Prefix used to identify interest-based onboarding questions. */
    public static final String INTEREST_PREFIX = "interest_";

    /** Penalty applied when a candidate's budget level differs by more than one step. */
    public static final double BUDGET_DEALBREAKER_PENALTY = 20.0;

    /**
     * Computes the compatibility score between two users.
     *
     * @param userA    the primary user
     * @param userB    the candidate user
     * @param weights  the scoring weights
     * @return the computed dimension scores
     */
    public ScoreResult compute(final UserMatchDto userA, final UserMatchDto userB, final Weights weights) {
        final double valuesScore = computeValuesScore(userA, userB);
        final double lifestyleScore = computeLifestyleScore(userA, userB);
        final double interestScore = computeInterestScore(userA, userB);

        final double weighted = (valuesScore * weights.values() + lifestyleScore * weights.lifestyle()
                + interestScore * weights.interest()) / weights.total();

        final double penalty = applyDealbreakers(userA, userB);
        final double overall = Math.max(0.0, Math.min(100.0, weighted - penalty));

        return new ScoreResult(overall, valuesScore, lifestyleScore, interestScore);
    }

    /**
     * Scores values alignment as the weighted share of matching values answers.
     *
     * @param userA the primary user
     * @param userB the candidate user
     * @return a score between 0 and 100
     */
    private double computeValuesScore(final UserMatchDto userA, final UserMatchDto userB) {
        final Map<String, OnboardingAnswerDto> valuesB = answersByKey(userB.getOnboardingAnswers(), VALUES_PREFIX);

        if (valuesB.isEmpty()) {
            return 0.0;
        }

        double totalWeight = 0.0;
        double matchedWeight = 0.0;

        for (final OnboardingAnswerDto answerA : answersByKey(userA.getOnboardingAnswers(), VALUES_PREFIX).values()) {
            final OnboardingAnswerDto answerB = valuesB.get(answerA.getQuestionKey());
            if (answerB == null) {
                continue;
            }
            final int weight = normalizeWeight(answerA.getWeight());
            totalWeight += weight;
            if (answerA.getAnswerValue().equalsIgnoreCase(answerB.getAnswerValue())) {
                matchedWeight += weight;
            }
        }

        return totalWeight == 0.0 ? 0.0 : (matchedWeight / totalWeight) * 100.0;
    }

    /**
     * Scores lifestyle alignment by comparing schedule, personality, budget
     * and work type equalities.
     *
     * @param userA the primary user
     * @param userB the candidate user
     * @return a score between 0 and 100
     */
    private double computeLifestyleScore(final UserMatchDto userA, final UserMatchDto userB) {
        final int schedule = userA.getSchedulePreference() != null
                && userA.getSchedulePreference().equals(userB.getSchedulePreference()) ? 1 : 0;
        final int personality = userA.getPersonalityType() != null
                && userA.getPersonalityType().equals(userB.getPersonalityType()) ? 1 : 0;
        final int budget = userA.getBudgetLevel() != null
                && userA.getBudgetLevel().equals(userB.getBudgetLevel()) ? 1 : 0;
        final int work = userA.getWorkType() != null
                && userA.getWorkType().equals(userB.getWorkType()) ? 1 : 0;

        return ((schedule + personality + budget + work) / 4.0) * 100.0;
    }

    /**
     * Scores interest overlap using Jaccard similarity on interest answers.
     *
     * @param userA the primary user
     * @param userB the candidate user
     * @return a score between 0 and 100
     */
    private double computeInterestScore(final UserMatchDto userA, final UserMatchDto userB) {
        final Set<String> interestsA = answerValues(userA.getOnboardingAnswers(), INTEREST_PREFIX);
        final Set<String> interestsB = answerValues(userB.getOnboardingAnswers(), INTEREST_PREFIX);

        if (interestsA.isEmpty() && interestsB.isEmpty()) {
            return 50.0; // neutral when neither user has interests recorded
        }
        if (interestsA.isEmpty() || interestsB.isEmpty()) {
            return 0.0;
        }

        final int intersection = interestsA.stream().filter(interestsB::contains).toList().size();
        final int union = interestsA.size() + interestsB.size() - intersection;

        return union == 0 ? 0.0 : ((double) intersection / union) * 100.0;
    }

    /**
     * Applies dealbreaker penalties (hard filters) based on budget mismatch.
     *
     * @param userA the primary user
     * @param userB the candidate user
     * @return the penalty to subtract from the overall score
     */
    private double applyDealbreakers(final UserMatchDto userA, final UserMatchDto userB) {
        final int budgetA = budgetRank(userA.getBudgetLevel());
        final int budgetB = budgetRank(userB.getBudgetLevel());

        if (budgetA >= 0 && budgetB >= 0 && Math.abs(budgetA - budgetB) > 1) {
            return BUDGET_DEALBREAKER_PENALTY;
        }
        return 0.0;
    }

    /**
     * Maps an answer list to a keyed map filtered by question prefix.
     *
     * @param answers the answer list
     * @param prefix  the question key prefix
     * @return a keyed map of answers
     */
    private Map<String, OnboardingAnswerDto> answersByKey(final List<OnboardingAnswerDto> answers, final String prefix) {
        if (answers == null) {
            return Map.of();
        }
        return answers.stream()
                .filter(a -> a.getQuestionKey() != null && a.getQuestionKey().startsWith(prefix))
                .collect(Collectors.toMap(OnboardingAnswerDto::getQuestionKey, Function.identity(), (a, b) -> a));
    }

    /**
     * Extracts the answer values for a question prefix as a set.
     *
     * @param answers the answer list
     * @param prefix  the question key prefix
     * @return the set of answer values
     */
    private Set<String> answerValues(final List<OnboardingAnswerDto> answers, final String prefix) {
        return answersByKey(answers, prefix).values().stream()
                .map(OnboardingAnswerDto::getAnswerValue)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    /**
     * Clamps a weight into the 1-5 range (defaults to 1 when missing).
     *
     * @param weight the raw weight
     * @return the normalized weight
     */
    private int normalizeWeight(final Integer weight) {
        if (weight == null) {
            return 1;
        }
        return Math.max(1, Math.min(5, weight));
    }

    /**
     * Ranks a budget level into an ordinal step, or -1 when absent.
     *
     * @param budget the budget level string
     * @return the rank, or -1
     */
    private int budgetRank(final String budget) {
        return switch (budget == null ? "" : budget.toUpperCase()) {
            case "LOW" -> 0;
            case "MEDIUM" -> 1;
            case "HIGH" -> 2;
            default -> -1;
        };
    }

    /**
     * Weight configuration for the scoring dimensions.
     *
     * @param values    weight of the values dimension
     * @param lifestyle weight of the lifestyle dimension
     * @param interest  weight of the interest dimension
     */
    public record Weights(double values, double lifestyle, double interest) {

        /**
         * Returns the sum of all weights.
         *
         * @return the total weight
         */
        public double total() {
            return values + lifestyle + interest;
        }
    }

    /**
     * Result of a scoring computation.
     *
     * @param overallScore   the weighted overall score (0-100)
     * @param valuesScore    the values alignment score (0-100)
     * @param lifestyleScore the lifestyle alignment score (0-100)
     * @param interestScore  the interest overlap score (0-100)
     */
    public record ScoreResult(double overallScore, double valuesScore, double lifestyleScore, double interestScore) {
    }
}
