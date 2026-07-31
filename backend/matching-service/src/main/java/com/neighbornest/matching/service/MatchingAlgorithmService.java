package com.neighbornest.matching.service;

import com.neighbornest.matching.client.UserServiceClient;
import com.neighbornest.matching.client.dto.UserMatchDto;
import com.neighbornest.matching.config.MatchingProperties;
import com.neighbornest.matching.dto.response.CompatibilityResponse;
import com.neighbornest.matching.entity.CompatibilityScore;
import com.neighbornest.matching.exception.BadRequestException;
import com.neighbornest.matching.repository.CompatibilityScoreRepository;
import com.neighbornest.matching.service.ScoringEngine.Weights;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Orchestrates the compatibility matching workflow.
 * <p>
 * Fetches eligible users from the user-service, computes weighted
 * compatibility scores with the {@link ScoringEngine}, persists them, and
 * serves the top-N most compatible users.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingAlgorithmService {

    private final UserServiceClient userServiceClient;
    private final CompatibilityScoreRepository compatibilityScoreRepository;
    private final MatchingProperties matchingProperties;
    private final ScoringEngine scoringEngine;

    /**
     * Calculates compatibility scores for a user against all eligible users.
     *
     * @param userId the user profile ID
     * @return the number of scores computed
     * @throws BadRequestException if the user is not among the eligible users
     */
    @Transactional
    public int calculateForUser(final Long userId) {
        log.info("Calculating compatibility scores for user: {}", userId);

        final List<UserMatchDto> eligible = userServiceClient.getReadyForMatch();
        final UserMatchDto subject = eligible.stream()
                .filter(u -> userId.equals(u.getUserId()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("User " + userId + " is not eligible for matching"));

        // Replace stale scores involving this user
        compatibilityScoreRepository.deleteByUserId1OrUserId2(userId, userId);

        final Weights weights = new Weights(
                matchingProperties.getWeights().getValues(),
                matchingProperties.getWeights().getLifestyle(),
                matchingProperties.getWeights().getInterest());

        final List<CompatibilityScore> scores = eligible.stream()
                .filter(candidate -> !userId.equals(candidate.getUserId()))
                .map(candidate -> toScore(subject, candidate, weights))
                .toList();

        compatibilityScoreRepository.saveAll(scores);
        log.info("Calculated {} compatibility scores for user: {}", scores.size(), userId);

        return scores.size();
    }

    /**
     * Returns the top-N compatible users for a user with their scores.
     * <p>
     * Queries both orientations of the stored pair (the user may be either
     * {@code userId1} or {@code userId2} depending on who triggered the
     * calculation), merges, sorts, and truncates to the configured top-N.
     * </p>
     *
     * @param userId the user profile ID
     * @return the ordered list of compatibility responses
     */
    @Transactional(readOnly = true)
    public List<CompatibilityResponse> getTopCompatibles(final Long userId) {
        log.debug("Fetching top {} compatible users for user: {}", matchingProperties.getTopN(), userId);

        final int topN = matchingProperties.getTopN();
        final PageRequest limit = PageRequest.of(0, topN);

        final List<CompatibilityScore> bothOrientations = new ArrayList<>(
                compatibilityScoreRepository.findByUserId1OrderByOverallScoreDesc(userId, limit));
        bothOrientations.addAll(compatibilityScoreRepository.findByUserId2OrderByOverallScoreDesc(userId, limit));

        // Deduplicate by partner: the same pair may be stored in both
        // orientations if each user triggered a calculation. Keep the best
        // score for each partner.
        final Map<Long, CompatibilityScore> bestByPartner = new LinkedHashMap<>();
        for (final CompatibilityScore score : bothOrientations) {
            final Long otherUserId = userId.equals(score.getUserId1()) ? score.getUserId2() : score.getUserId1();
            bestByPartner.merge(otherUserId, score,
                    (a, b) -> a.getOverallScore().compareTo(b.getOverallScore()) >= 0 ? a : b);
        }

        return bestByPartner.values().stream()
                .sorted(Comparator.comparing(CompatibilityScore::getOverallScore).reversed())
                .limit(topN)
                .map(score -> toResponse(score, userId))
                .toList();
    }

    /**
     * Computes and persists a single compatibility score between two users.
     *
     * @param subject   the primary user
     * @param candidate the candidate user
     * @param weights   the scoring weights
     * @return the persisted score entity
     */
    private CompatibilityScore toScore(final UserMatchDto subject, final UserMatchDto candidate, final Weights weights) {
        final ScoringEngine.ScoreResult result = scoringEngine.compute(subject, candidate, weights);

        return CompatibilityScore.builder()
                .userId1(subject.getUserId())
                .userId2(candidate.getUserId())
                .overallScore(CompatibilityScore.roundScore(result.overallScore()))
                .valuesScore(CompatibilityScore.roundScore(result.valuesScore()))
                .lifestyleScore(CompatibilityScore.roundScore(result.lifestyleScore()))
                .interestScore(CompatibilityScore.roundScore(result.interestScore()))
                .build();
    }

    /**
     * Maps a score entity to its response DTO, resolving the "other" user
     * based on the requesting user's orientation in the stored pair.
     *
     * @param score  the score entity
     * @param userId the requesting user ID
     * @return the response DTO
     */
    private CompatibilityResponse toResponse(final CompatibilityScore score, final Long userId) {
        final Long otherUserId = userId.equals(score.getUserId1()) ? score.getUserId2() : score.getUserId1();

        return CompatibilityResponse.builder()
                .userId(otherUserId)
                .overallScore(score.getOverallScore())
                .valuesScore(score.getValuesScore())
                .lifestyleScore(score.getLifestyleScore())
                .interestScore(score.getInterestScore())
                .build();
    }
}
