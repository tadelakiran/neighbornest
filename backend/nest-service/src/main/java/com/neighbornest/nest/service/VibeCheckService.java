package com.neighbornest.nest.service;

import com.neighbornest.nest.dto.request.VibeCheckRequest;
import com.neighbornest.nest.dto.response.VibeCheckResponse;
import com.neighbornest.nest.dto.response.VibeCheckStatusResponse;
import com.neighbornest.nest.entity.VibeCheck;
import com.neighbornest.nest.exception.ResourceNotFoundException;
import com.neighbornest.nest.repository.NestRepository;
import com.neighbornest.nest.repository.VibeCheckRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Service handling Nest vibe checks.
 * <p>
 * Allows members to rate connection and comfort and provides an aggregated
 * admin view of scores.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VibeCheckService {

    private final VibeCheckRepository vibeCheckRepository;
    private final NestRepository nestRepository;

    /**
     * Submits a vibe check for the authenticated user.
     *
     * @param nestId  the nest ID
     * @param userId  the user profile ID
     * @param request the vibe check request
     * @return the submitted vibe check
     */
    @Transactional
    public VibeCheckResponse submit(final Long nestId, final Long userId, final VibeCheckRequest request) {
        ensureNestExists(nestId);

        final VibeCheck check = VibeCheck.builder()
                .nestId(nestId)
                .userId(userId)
                .connectionScore(request.getConnectionScore())
                .comfortScore(request.getComfortScore())
                .feedback(request.getFeedback())
                .build();

        final VibeCheck saved = vibeCheckRepository.save(check);
        log.info("Vibe check submitted by user: {} for nest: {}", userId, nestId);

        return toResponse(saved);
    }

    /**
     * Returns the aggregated vibe check status for a Nest.
     *
     * @param nestId the nest ID
     * @return the aggregated status
     */
    @Transactional(readOnly = true)
    public VibeCheckStatusResponse getStatus(final Long nestId) {
        ensureNestExists(nestId);

        final List<VibeCheck> checks = vibeCheckRepository.findByNestId(nestId);

        if (checks.isEmpty()) {
            return VibeCheckStatusResponse.builder()
                    .averageConnection(BigDecimal.ZERO)
                    .averageComfort(BigDecimal.ZERO)
                    .overallAverage(BigDecimal.ZERO)
                    .submissionCount(0)
                    .submissions(List.of())
                    .build();
        }

        final double avgConnection = checks.stream().mapToInt(VibeCheck::getConnectionScore).average().orElse(0.0);
        final double avgComfort = checks.stream().mapToInt(VibeCheck::getComfortScore).average().orElse(0.0);

        return VibeCheckStatusResponse.builder()
                .averageConnection(BigDecimal.valueOf(avgConnection).setScale(2, RoundingMode.HALF_UP))
                .averageComfort(BigDecimal.valueOf(avgComfort).setScale(2, RoundingMode.HALF_UP))
                .overallAverage(BigDecimal.valueOf((avgConnection + avgComfort) / 2.0).setScale(2, RoundingMode.HALF_UP))
                .submissionCount(checks.size())
                .submissions(checks.stream().map(this::toResponse).toList())
                .build();
    }

    /**
     * Verifies the nest exists.
     *
     * @param nestId the nest ID
     */
    private void ensureNestExists(final Long nestId) {
        if (!nestRepository.existsById(nestId)) {
            throw new ResourceNotFoundException("Nest not found with id: " + nestId);
        }
    }

    /**
     * Maps a vibe check entity to its response DTO.
     *
     * @param check the vibe check entity
     * @return the response DTO
     */
    private VibeCheckResponse toResponse(final VibeCheck check) {
        return VibeCheckResponse.builder()
                .userId(check.getUserId())
                .connectionScore(check.getConnectionScore())
                .comfortScore(check.getComfortScore())
                .feedback(check.getFeedback())
                .submittedAt(check.getSubmittedAt())
                .build();
    }
}
