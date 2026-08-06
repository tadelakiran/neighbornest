package com.neighbornest.user.service;

import com.neighbornest.user.dto.request.AnchorApplyRequest;
import com.neighbornest.user.dto.request.AnchorReviewRequest.ReviewDecision;
import com.neighbornest.user.dto.response.AnchorApplicationResponse;
import com.neighbornest.user.entity.AnchorApplication;
import com.neighbornest.user.entity.AnchorStatus;
import com.neighbornest.user.entity.UserProfile;
import com.neighbornest.user.entity.UserRole;
import com.neighbornest.user.exception.BadRequestException;
import com.neighbornest.user.exception.ResourceNotFoundException;
import com.neighbornest.user.repository.AnchorApplicationRepository;
import com.neighbornest.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

        return toResponse(saved, profile.getFullName());
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

        return toResponse(application, profile.getFullName());
    }

    /**
     * Reviews a pending anchor application (admin action).
     * <p>
     * Sets the review status and timestamp, records an optional note, and
     * promotes the applicant's profile role to {@link UserRole#ANCHOR} when
     * the application is approved.
     * </p>
     *
     * @param applicationId the application ID
     * @param decision      the approve/reject decision
     * @param note          optional reviewer note
     * @return the updated application as an {@link AnchorApplicationResponse}
     * @throws ResourceNotFoundException if the application does not exist
     * @throws BadRequestException       if the application is not pending
     */
    @Transactional
    public AnchorApplicationResponse review(final Long applicationId, final ReviewDecision decision, final String note) {
        final AnchorApplication application = anchorApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Anchor application not found with id: " + applicationId));

        if (application.getStatus() != AnchorStatus.PENDING) {
            log.warn("Anchor review rejected: application {} already reviewed (status {})",
                    applicationId, application.getStatus());
            throw new BadRequestException("Only pending applications can be reviewed");
        }

        application.setStatus(decision == ReviewDecision.APPROVE
                ? AnchorStatus.APPROVED
                : AnchorStatus.REJECTED);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewNote(note);

        final AnchorApplication saved = anchorApplicationRepository.save(application);

        final UserProfile applicant = userProfileRepository.findById(saved.getUserProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with id: " + saved.getUserProfileId()));
        if (decision == ReviewDecision.APPROVE && applicant.getRole() != UserRole.ANCHOR) {
            applicant.setRole(UserRole.ANCHOR);
            userProfileRepository.save(applicant);
            log.info("Profile {} promoted to ANCHOR", saved.getUserProfileId());
        }

        log.info("Anchor application {} {}", applicationId,
                decision == ReviewDecision.APPROVE ? "approved" : "rejected");

        return toResponse(saved, applicant.getFullName());
    }

    /**
     * Lists anchor applications for admin review, optionally filtered by status.
     *
     * @param status optional status filter ({@code null} returns all)
     * @return the list of application responses, most recent first
     */
    @Transactional(readOnly = true)
    public List<AnchorApplicationResponse> listApplications(final AnchorStatus status) {
        final List<AnchorApplication> applications = status == null
                ? anchorApplicationRepository.findAllByOrderByAppliedAtDesc()
                : anchorApplicationRepository.findAllByStatusOrderByAppliedAtDesc(status);
        if (applications.isEmpty()) {
            return List.of();
        }

        // Batch-fetch applicant names in ONE query (no N+1) for the admin list.
        final Map<Long, String> namesByProfileId = userProfileRepository
                .findAllById(applications.stream().map(AnchorApplication::getUserProfileId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(UserProfile::getId, UserProfile::getFullName));

        return applications.stream()
                .map(application -> toResponse(application, namesByProfileId.get(application.getUserProfileId())))
                .toList();
    }

    /**
     * Maps an anchor application entity to its response DTO.
     *
     * @param application the entity
     * @param fullName    the applicant's full name (may be {@code null})
     * @return the response DTO
     */
    private AnchorApplicationResponse toResponse(final AnchorApplication application, final String fullName) {
        return AnchorApplicationResponse.builder()
                .id(application.getId())
                .userProfileId(application.getUserProfileId())
                .fullName(fullName)
                .yearsInCity(application.getYearsInCity())
                .neighborhoodsKnown(application.getNeighborhoodsKnown())
                .languagesSpoken(application.getLanguagesSpoken())
                .experience(application.getExperience())
                .availability(application.getAvailability())
                .status(application.getStatus())
                .appliedAt(application.getAppliedAt())
                .reviewedAt(application.getReviewedAt())
                .reviewNote(application.getReviewNote())
                .build();
    }
}
