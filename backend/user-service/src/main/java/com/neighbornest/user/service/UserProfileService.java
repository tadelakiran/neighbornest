package com.neighbornest.user.service;

import com.neighbornest.user.client.AuthServiceClient;
import com.neighbornest.user.dto.request.ProfileCreateRequest;
import com.neighbornest.user.dto.request.ProfileUpdateRequest;
import com.neighbornest.user.dto.response.AuthValidationResponse;
import com.neighbornest.user.dto.response.OnboardingStatusResponse;
import com.neighbornest.user.dto.response.ProfileResponse;
import com.neighbornest.user.dto.response.UserMatchResponse;
import com.neighbornest.user.entity.OnboardingAnswer;
import com.neighbornest.user.entity.UserProfile;
import com.neighbornest.user.entity.UserRole;
import com.neighbornest.user.exception.BadRequestException;
import com.neighbornest.user.exception.DuplicateProfileException;
import com.neighbornest.user.exception.ResourceNotFoundException;
import com.neighbornest.user.repository.AnchorApplicationRepository;
import com.neighbornest.user.repository.OnboardingAnswerRepository;
import com.neighbornest.user.repository.UserProfileRepository;
import com.neighbornest.user.util.UserProfileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service handling user profile lifecycle operations.
 * <p>
 * Creates, reads and updates {@link UserProfile} entities, resolves the
 * current user from the authenticated JWT, and exposes match-ready data for
 * the matching-service. Confirms token ownership with the auth-service via
 * Feign when required.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final OnboardingAnswerRepository onboardingAnswerRepository;
    private final AnchorApplicationRepository anchorApplicationRepository;
    private final AuthServiceClient authServiceClient;
    private final UserProfileMapper userProfileMapper;
    private final PhotoStorageService photoStorageService;

    /**
     * Creates a new profile for the authenticated user.
     * <p>
     * The {@code authUserId} is taken from the validated JWT (never from the
     * request body), then ownership is optionally confirmed with the
     * auth-service via Feign.
     * </p>
     *
     * @param authUserId the auth-service user ID from the JWT
     * @param token      the raw Bearer token used to confirm ownership
     * @param request    the profile creation request
     * @return the created profile as a {@link ProfileResponse}
     * @throws DuplicateProfileException if a profile already exists for the user
     */
    @Transactional
    public ProfileResponse createProfile(final Long authUserId, final String token, final ProfileCreateRequest request) {
        log.info("Creating profile for authUserId: {}", authUserId);

        if (userProfileRepository.existsByAuthUserId(authUserId)) {
            log.warn("Profile creation failed: profile already exists for authUserId {}", authUserId);
            throw new DuplicateProfileException("A profile already exists for this user");
        }

        confirmTokenOwnership(token, authUserId);

        final UserProfile profile = UserProfile.builder()
                .authUserId(authUserId)
                .fullName(request.getFullName().trim())
                .profilePhotoUrl(request.getProfilePhotoUrl())
                .city(request.getCity() != null ? request.getCity().trim() : null)
                .neighborhood(request.getNeighborhood())
                .yearsInCity(request.getYearsInCity())
                .occupation(request.getOccupation())
                .role(request.getRole() != null ? request.getRole() : UserRole.NEWCOMER)
                .build();

        final UserProfile saved = userProfileRepository.save(profile);
        log.info("Profile created successfully with id: {}", saved.getId());

        return userProfileMapper.toProfileResponse(saved, List.of());
    }

    /**
     * Returns the full profile of the authenticated user with onboarding answers.
     *
     * @param authUserId the auth-service user ID from the JWT
     * @return the profile as a {@link ProfileResponse}
     * @throws ResourceNotFoundException if no profile exists for the user
     */
    @Transactional(readOnly = true)
    public ProfileResponse getCurrentProfile(final Long authUserId) {
        final UserProfile profile = findProfileByAuthUserId(authUserId);
        return toResponseWithAnswers(profile);
    }

    /**
     * Updates the profile fields of the authenticated user.
     *
     * @param authUserId the auth-service user ID from the JWT
     * @param request    the partial update request
     * @return the updated profile as a {@link ProfileResponse}
     */
    @Transactional
    public ProfileResponse updateProfile(final Long authUserId, final ProfileUpdateRequest request) {
        final UserProfile profile = findProfileByAuthUserId(authUserId);
        applyUpdates(profile, request);
        final UserProfile saved = userProfileRepository.save(profile);
        log.info("Profile updated for authUserId: {}", authUserId);
        return toResponseWithAnswers(saved);
    }

    /**
     * Deletes the profile of the authenticated user along with all dependent
     * data (onboarding answers and anchor applications).
     *
     * @param authUserId the auth-service user ID from the JWT
     * @throws ResourceNotFoundException if no profile exists for the user
     */
    @Transactional
    public void deleteProfile(final Long authUserId) {
        final UserProfile profile = findProfileByAuthUserId(authUserId);

        onboardingAnswerRepository.deleteByUserProfileId(profile.getId());
        anchorApplicationRepository.deleteByUserProfileId(profile.getId());
        userProfileRepository.delete(profile);

        deleteStoredPhoto(profile.getProfilePhotoUrl());

        log.info("Profile deleted for authUserId: {}", authUserId);
    }

    /**
     * Uploads and stores a profile photo for the authenticated user, updating
     * the profile's photo URL to the served location.
     *
     * @param authUserId the auth-service user ID from the JWT
     * @param file       the uploaded image file
     * @return the updated profile as a {@link ProfileResponse}
     * @throws ResourceNotFoundException if no profile exists for the user
     */
    @Transactional
    public ProfileResponse uploadProfilePhoto(final Long authUserId, final MultipartFile file) {
        final UserProfile profile = findProfileByAuthUserId(authUserId);

        final String previousUrl = profile.getProfilePhotoUrl();
        final String storedName = photoStorageService.store(file);
        profile.setProfilePhotoUrl("/api/users/photo/" + storedName);
        final UserProfile saved = userProfileRepository.save(profile);

        // Best-effort cleanup of the replaced photo so files don't accumulate.
        deleteStoredPhoto(previousUrl);

        log.info("Profile photo updated for authUserId: {}", authUserId);
        return toResponseWithAnswers(saved);
    }

    /**
     * Deletes a stored photo file when the profile's photo URL points at a
     * user-service-managed file (never an external URL). Best-effort — a
     * failed file delete only logs a warning and never fails the request.
     *
     * @param photoUrl the profile photo URL, may be {@code null}
     */
    private void deleteStoredPhoto(final String photoUrl) {
        if (photoUrl != null && photoUrl.startsWith("/api/users/photo/")) {
            photoStorageService.delete(photoUrl.substring("/api/users/photo/".length()));
        }
    }

    /**
     * Returns the public profile view of another user (used by Nest members).
     *
     * @param profileId the profile ID of the target user
     * @return the profile as a {@link ProfileResponse}
     * @throws ResourceNotFoundException if the profile does not exist
     */
    @Transactional(readOnly = true)
    public ProfileResponse getPublicProfile(final Long profileId) {
        final UserProfile profile = userProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with id: " + profileId));
        return toResponseWithAnswers(profile);
    }

    /**
     * Returns the onboarding completion status for the authenticated user.
     *
     * @param authUserId the auth-service user ID from the JWT
     * @return the onboarding status DTO
     */
    @Transactional(readOnly = true)
    public OnboardingStatusResponse getOnboardingStatus(final Long authUserId) {
        final UserProfile profile = findProfileByAuthUserId(authUserId);
        final long answerCount = onboardingAnswerRepository.countByUserProfileId(profile.getId());

        return OnboardingStatusResponse.builder()
                .isOnboarded(profile.isOnboarded())
                .answerCount(answerCount)
                .build();
    }

    /**
     * Lists all users ready for matching (onboarded, with complete data).
     *
     * @return list of {@link UserMatchResponse} DTOs
     */
    @Transactional(readOnly = true)
    public List<UserMatchResponse> getReadyForMatch() {
        final List<UserProfile> profiles = userProfileRepository.findAllReadyForMatch();
        if (profiles.isEmpty()) {
            return List.of();
        }

        // Batch-fetch every answer for all profiles in ONE query (no N+1).
        final List<OnboardingAnswer> allAnswers = onboardingAnswerRepository
                .findAllByUserProfileIdIn(profiles.stream().map(UserProfile::getId).toList());
        final Map<Long, List<OnboardingAnswer>> answersByProfile = allAnswers.stream()
                .collect(Collectors.groupingBy(OnboardingAnswer::getUserProfileId));

        return profiles.stream()
                .map(profile -> userProfileMapper.toMatchResponse(
                        profile,
                        answersByProfile.getOrDefault(profile.getId(), List.of())))
                .toList();
    }

    /**
     * Finds a profile by auth-service user ID.
     *
     * @param authUserId the auth-service user ID
     * @return the matching profile
     * @throws ResourceNotFoundException if not found
     */
    private UserProfile findProfileByAuthUserId(final Long authUserId) {
        return userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user id: " + authUserId));
    }

    /**
     * Best-effort confirmation of token ownership with the auth-service.
     * <p>
     * The JWT is already validated locally by the security filter, so a
     * failed or unavailable confirmation (e.g. auth-service is down or the
     * validate endpoint is not yet deployed) only logs a warning instead of
     * blocking the request. This keeps the flow resilient during partial
     * deployments while still performing the check when the service is up.
     * </p>
     *
     * @param token      the raw Bearer token
     * @param authUserId the claimed user ID
     */
    private void confirmTokenOwnership(final String token, final Long authUserId) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Authorization token is required");
        }

        // The auth-service fallback factory returns a 503 ResponseEntity when
        // the service is down, so an error status simply logs a warning while
        // the locally-validated JWT continues to authorize the request.
        final ResponseEntity<AuthValidationResponse> response =
                authServiceClient.validateToken(stripBearerPrefix(token));

        if (response.getStatusCode().isError()
                || response.getBody() == null
                || !response.getBody().isValid()) {
            log.warn("Auth-service could not confirm token ownership; continuing with locally-validated JWT");
            return;
        }

        if (!authUserId.equals(response.getBody().getUserId())) {
            throw new BadRequestException("Token does not belong to the authenticated user");
        }
    }

    /**
     * Strips the {@code Bearer } prefix from an Authorization header value so
     * only the raw JWT is sent to the auth-service validation endpoint.
     *
     * @param authHeader the Authorization header value
     * @return the bare JWT token
     */
    private String stripBearerPrefix(final String authHeader) {
        return authHeader.startsWith("Bearer ") ? authHeader.substring("Bearer ".length()) : authHeader;
    }

    /**
     * Applies a partial update request onto an existing profile.
     *
     * @param profile the profile to update
     * @param request the update request
     */
    private void applyUpdates(final UserProfile profile, final ProfileUpdateRequest request) {
        if (request.getFullName() != null) {
            profile.setFullName(request.getFullName().trim());
        }
        if (request.getProfilePhotoUrl() != null) {
            profile.setProfilePhotoUrl(request.getProfilePhotoUrl());
        }
        if (request.getCity() != null) {
            profile.setCity(request.getCity().trim());
        }
        if (request.getNeighborhood() != null) {
            profile.setNeighborhood(request.getNeighborhood());
        }
        if (request.getYearsInCity() != null) {
            profile.setYearsInCity(request.getYearsInCity());
        }
        if (request.getOccupation() != null) {
            profile.setOccupation(request.getOccupation());
        }
        if (request.getWorkType() != null) {
            profile.setWorkType(request.getWorkType());
        }
        if (request.getPersonalityType() != null) {
            profile.setPersonalityType(request.getPersonalityType());
        }
        if (request.getSchedulePreference() != null) {
            profile.setSchedulePreference(request.getSchedulePreference());
        }
        if (request.getSocialGoal() != null) {
            profile.setSocialGoal(request.getSocialGoal());
        }
        if (request.getBudgetLevel() != null) {
            profile.setBudgetLevel(request.getBudgetLevel());
        }
        if (request.getRole() != null) {
            profile.setRole(request.getRole());
        }
    }

    /**
     * Builds a full profile response including onboarding answers.
     *
     * @param profile the profile entity
     * @return the response DTO
     */
    private ProfileResponse toResponseWithAnswers(final UserProfile profile) {
        return userProfileMapper.toProfileResponse(
                profile,
                onboardingAnswerRepository.findByUserProfileIdOrderByQuestionKeyAsc(profile.getId()));
    }

    /**
     * Builds a lightweight match response including onboarding answers.
     *
     * @param profile the profile entity
     * @return the match DTO
     */
    private UserMatchResponse toMatchResponseWithAnswers(final UserProfile profile) {
        return userProfileMapper.toMatchResponse(
                profile,
                onboardingAnswerRepository.findByUserProfileIdOrderByQuestionKeyAsc(profile.getId()));
    }
}
