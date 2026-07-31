package com.neighbornest.user.service;

import com.neighbornest.user.dto.request.AnchorApplyRequest;
import com.neighbornest.user.dto.response.AnchorApplicationResponse;
import com.neighbornest.user.entity.AnchorApplication;
import com.neighbornest.user.entity.UserProfile;
import com.neighbornest.user.exception.BadRequestException;
import com.neighbornest.user.exception.ResourceNotFoundException;
import com.neighbornest.user.repository.AnchorApplicationRepository;
import com.neighbornest.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling anchor applications.
 * <p>
 * Allows onboarded users to apply to become local Anchors. Submitting a new
 * application supersedes any previous pending application.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnchorApplicationService {

    private final AnchorApplicationRepository anchorApplicationRepository;
    private final UserProfileRepository userProfileRepository;

    /**
     * Submits an anchor application for the authenticated user.
     *
     * @param authUserId the auth-service user ID from the JWT
     * @param request    the anchor application request
     * @return the created application as a {@link AnchorApplicationResponse}
     * @throws ResourceNotFoundException if the profile does not exist
     * @throws BadRequestException       if the user has not completed onboarding
     */
    @Transactional
    public AnchorApplicationResponse apply(final Long authUserId, final AnchorApplyRequest request) {
        final UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user id: " + authUserId));

        if (!profile.isOnboarded()) {
            log.warn("Anchor application rejected: user {} has not completed onboarding", authUserId);
            throw new BadRequestException("Complete onboarding before applying to become an anchor");
        }

        final AnchorApplication application = AnchorApplication.builder()
                .userProfileId(profile.getId())
                .yearsInCity(request.getYearsInCity())
                .neighborhoodsKnown(request.getNeighborhoodsKnown())
                .languagesSpoken(request.getLanguagesSpoken())
                .experience(request.getExperience())
                .availability(request.getAvailability())
                .build();

        final AnchorApplication saved = anchorApplicationRepository.save(application);
        log.info("Anchor application submitted with id: {}", saved.getId());

        return toResponse(saved);
    }

    /**
     * Returns the most recent anchor application for the authenticated user.
     *
     * @param authUserId the auth-service user ID from the JWT
     * @return the application response
     * @throws ResourceNotFoundException if the profile or application does not exist
     */
    @Transactional(readOnly = true)
    public AnchorApplicationResponse getMyApplication(final Long authUserId) {
        final UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user id: " + authUserId));

        final AnchorApplication application = anchorApplicationRepository
                .findTopByUserProfileIdOrderByAppliedAtDesc(profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No anchor application found for this user"));

        return toResponse(application);
    }

    /**
     * Maps an anchor application entity to its response DTO.
     *
     * @param application the entity
     * @return the response DTO
     */
    private AnchorApplicationResponse toResponse(final AnchorApplication application) {
        return AnchorApplicationResponse.builder()
                .id(application.getId())
                .userProfileId(application.getUserProfileId())
                .yearsInCity(application.getYearsInCity())
                .neighborhoodsKnown(application.getNeighborhoodsKnown())
                .languagesSpoken(application.getLanguagesSpoken())
                .experience(application.getExperience())
                .availability(application.getAvailability())
                .status(application.getStatus())
                .appliedAt(application.getAppliedAt())
                .reviewedAt(application.getReviewedAt())
                .build();
    }
}
