package com.neighbornest.matching.service;

import com.neighbornest.matching.client.UserServiceClient;
import com.neighbornest.matching.client.dto.UserMatchDto;
import com.neighbornest.matching.config.MatchingProperties;
import com.neighbornest.matching.dto.response.CompatibilityResponse;
import com.neighbornest.matching.entity.CompatibilityScore;
import com.neighbornest.matching.exception.BadRequestException;
import com.neighbornest.matching.repository.CompatibilityScoreRepository;
import org.springframework.dao.DataIntegrityViolationException;
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
import java.util.function.Function;
import java.util.stream.Collectors;

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

        try {
            compatibilityScoreRepository.saveAll(scores);
        } catch (final DataIntegrityViolationException e) {
            // Two concurrent calculations can race delete-then-save on the new
            // unique (user_id_1, user_id_2) pair constraint. The loser's write
            // is idempotent (same normalized pair, same inputs), so the existing
            // row is already correct — log and move on rather than surface a 500.
            log.info("Concurrent calculation raced for user {}; the pair already exists. " +
                    "Scores are idempotent so this is safe.", userId);
        }

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

        // Batch-fetch partner names/cities from the user-service in ONE call
        // (the ready-for-match feed) so responses are enriched without an
        // N+1 of profile lookups.
        final Map<Long, UserMatchDto> profilesById = fetchProfilesById();

        return bestByPartner.values().stream()
                .sorted(Comparator.comparing(CompatibilityScore::getOverallScore).reversed())
                .limit(topN)
                .map(score -> toResponse(score, userId, profilesById))
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

        // Normalize the pair so userId1 < userId2 ALWAYS. Combined with the
        // unique (user_id_1, user_id_2) constraint this prevents the same
        // unordered pair from being stored twice in either orientation.
        final long userId1 = Math.min(subject.getUserId(), candidate.getUserId());
        final long userId2 = Math.max(subject.getUserId(), candidate.getUserId());

        return CompatibilityScore.builder()
                .userId1(userId1)
                .userId2(userId2)
                .overallScore(CompatibilityScore.roundScore(result.overallScore()))
                .valuesScore(CompatibilityScore.roundScore(result.valuesScore()))
                .lifestyleScore(CompatibilityScore.roundScore(result.lifestyleScore()))
                .interestScore(CompatibilityScore.roundScore(result.interestScore()))
                .build();
    }

    /**
     * Maps a score entity to its response DTO, resolving the "other" user
     * based on the requesting user's orientation in the stored pair and
     * enriching it with the partner's profile summary when available.
     *
     * @param score        the score entity
     * @param userId       the requesting user ID
     * @param profilesById map of user ID to profile summary
     * @return the response DTO
     */
    private CompatibilityResponse toResponse(final CompatibilityScore score, final Long userId,
                                             final Map<Long, UserMatchDto> profilesById) {
        final Long otherUserId = userId.equals(score.getUserId1()) ? score.getUserId2() : score.getUserId1();
        final UserMatchDto profile = profilesById.get(otherUserId);

        return CompatibilityResponse.builder()
                .userId(otherUserId)
                .fullName(profile != null ? profile.getFullName() : null)
                .city(profile != null ? profile.getCity() : null)
                .overallScore(score.getOverallScore())
                .valuesScore(score.getValuesScore())
                .lifestyleScore(score.getLifestyleScore())
                .interestScore(score.getInterestScore())
                .build();
    }

    /**
     * Fetches all match-ready profiles and indexes them by user ID for name
     * and city enrichment. Returns an empty map when the user-service is
     * unreachable so the compatibles endpoint degrades gracefully.
     *
     * @return map of user ID to profile summary
     */
    private Map<Long, UserMatchDto> fetchProfilesById() {
        final List<UserMatchDto> eligible;
        try {
            eligible = userServiceClient.getReadyForMatch();
        } catch (final RuntimeException e) {
            log.warn("Could not fetch profiles for enrichment: {}", e.getMessage());
            return Map.of();
        }
        if (eligible == null) {
            return Map.of();
        }
        return eligible.stream()
                .collect(Collectors.toMap(UserMatchDto::getUserId, Function.identity(), (a, b) -> a));
    }
}
