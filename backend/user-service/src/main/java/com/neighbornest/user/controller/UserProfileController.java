package com.neighbornest.user.controller;

import com.neighbornest.user.dto.request.AnchorApplyRequest;
import com.neighbornest.user.dto.request.OnboardingSubmitRequest;
import com.neighbornest.user.dto.request.ProfileCreateRequest;
import com.neighbornest.user.dto.request.ProfileUpdateRequest;
import com.neighbornest.user.dto.response.AnchorApplicationResponse;
import com.neighbornest.user.dto.response.OnboardingStatusResponse;
import com.neighbornest.user.dto.response.ProfileResponse;
import com.neighbornest.user.dto.response.UserMatchResponse;
import com.neighbornest.user.security.AuthenticatedUser;
import com.neighbornest.user.service.AnchorApplicationService;
import com.neighbornest.user.service.OnboardingService;
import com.neighbornest.user.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for user profile operations.
 * <p>
 * Exposes endpoints for profile creation, retrieval, update, onboarding,
 * anchor applications, and match-ready data. All endpoints require a valid
 * JWT token; the current user is resolved from the JWT via
 * {@link AuthenticatedUser}.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
@RequestMapping(value = "/api/users", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Profiles", description = "Endpoints for user profile management and onboarding")
@SecurityRequirement(name = "bearerAuth")
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final OnboardingService onboardingService;
    private final AnchorApplicationService anchorApplicationService;

    /**
     * Creates a profile for the authenticated user.
     *
     * @param principal the authenticated user from the JWT
     * @param authHeader the raw Authorization header used to confirm token ownership
     * @param request   the profile creation request
     * @return the created profile with status 201 CREATED
     */
    @PostMapping("/profile")
    @Operation(summary = "Create user profile",
            description = "Creates a profile for the authenticated user. authUserId is taken from the JWT.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Profile created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "409", description = "Profile already exists")
    })
    public ResponseEntity<ProfileResponse> createProfile(
            @AuthenticationPrincipal final AuthenticatedUser principal,
            @RequestHeader(value = "Authorization", required = false) final String authHeader,
            @Valid @RequestBody final ProfileCreateRequest request) {

        log.debug("POST /api/users/profile - creating profile for authUserId: {}", principal.authUserId());
        final ProfileResponse response = userProfileService.createProfile(principal.authUserId(), authHeader, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns the current user's full profile with onboarding answers.
     *
     * @param principal the authenticated user from the JWT
     * @return the profile
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user profile",
            description = "Returns the full profile of the authenticated user including onboarding answers.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT required"),
            @ApiResponse(responseCode = "404", description = "Profile not found")
    })
    public ResponseEntity<ProfileResponse> getCurrentProfile(
            @AuthenticationPrincipal final AuthenticatedUser principal) {

        log.debug("GET /api/users/me - fetching profile for authUserId: {}", principal.authUserId());
        return ResponseEntity.ok(userProfileService.getCurrentProfile(principal.authUserId()));
    }

    /**
     * Updates the current user's profile.
     *
     * @param principal the authenticated user from the JWT
     * @param request   the partial update request
     * @return the updated profile
     */
    @PutMapping("/me")
    @Operation(summary = "Update current user profile",
            description = "Partially updates the profile fields of the authenticated user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Profile not found")
    })
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal final AuthenticatedUser principal,
            @Valid @RequestBody final ProfileUpdateRequest request) {

        log.debug("PUT /api/users/me - updating profile for authUserId: {}", principal.authUserId());
        return ResponseEntity.ok(userProfileService.updateProfile(principal.authUserId(), request));
    }

    /**
     * Submits onboarding answers and marks the user as onboarded.
     *
     * @param principal the authenticated user from the JWT
     * @param request   the onboarding submission request
     * @return the updated profile
     */
    @PostMapping("/onboarding")
    @Operation(summary = "Submit onboarding answers",
            description = "Stores onboarding answers and marks the profile as onboarded.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Onboarding completed"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Profile not found")
    })
    public ResponseEntity<ProfileResponse> submitOnboarding(
            @AuthenticationPrincipal final AuthenticatedUser principal,
            @Valid @RequestBody final OnboardingSubmitRequest request) {

        log.debug("POST /api/users/onboarding - submitting answers for authUserId: {}", principal.authUserId());
        return ResponseEntity.ok(onboardingService.submitOnboarding(principal.authUserId(), request));
    }

    /**
     * Returns the onboarding completion status.
     *
     * @param principal the authenticated user from the JWT
     * @return the onboarding status
     */
    @GetMapping("/onboarding/status")
    @Operation(summary = "Get onboarding status",
            description = "Returns whether the authenticated user has completed onboarding.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Profile not found")
    })
    public ResponseEntity<OnboardingStatusResponse> getOnboardingStatus(
            @AuthenticationPrincipal final AuthenticatedUser principal) {

        log.debug("GET /api/users/onboarding/status - for authUserId: {}", principal.authUserId());
        return ResponseEntity.ok(userProfileService.getOnboardingStatus(principal.authUserId()));
    }

    /**
     * Submits an anchor application for the authenticated user.
     *
     * @param principal the authenticated user from the JWT
     * @param request   the anchor application request
     * @return the created application with status 201 CREATED
     */
    @PostMapping("/anchor-apply")
    @Operation(summary = "Submit anchor application",
            description = "Submits an application to become a local Anchor.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Application submitted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data or onboarding incomplete"),
            @ApiResponse(responseCode = "404", description = "Profile not found")
    })
    public ResponseEntity<AnchorApplicationResponse> applyAsAnchor(
            @AuthenticationPrincipal final AuthenticatedUser principal,
            @Valid @RequestBody final AnchorApplyRequest request) {

        log.debug("POST /api/users/anchor-apply - for authUserId: {}", principal.authUserId());
        final AnchorApplicationResponse response = anchorApplicationService.apply(principal.authUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns the current user's most recent anchor application.
     *
     * @param principal the authenticated user from the JWT
     * @return the application
     */
    @GetMapping("/anchor-application")
    @Operation(summary = "Get my anchor application",
            description = "Returns the most recent anchor application of the authenticated user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Application retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "No application found")
    })
    public ResponseEntity<AnchorApplicationResponse> getMyAnchorApplication(
            @AuthenticationPrincipal final AuthenticatedUser principal) {

        log.debug("GET /api/users/anchor-application - for authUserId: {}", principal.authUserId());
        return ResponseEntity.ok(anchorApplicationService.getMyApplication(principal.authUserId()));
    }

    /**
     * Returns the public profile view of another user.
     *
     * @param profileId the target profile ID
     * @return the profile
     */
    @GetMapping("/{userId}/profile")
    @Operation(summary = "Get public profile",
            description = "Returns a public profile view for a user (used by Nest members).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Profile not found")
    })
    public ResponseEntity<ProfileResponse> getPublicProfile(@PathVariable("userId") final Long profileId) {
        log.debug("GET /api/users/{}/profile - fetching public profile", profileId);
        return ResponseEntity.ok(userProfileService.getPublicProfile(profileId));
    }

    /**
     * Lists all users ready for matching.
     *
     * @return list of match-ready users
     */
    @GetMapping("/ready-for-match")
    @Operation(summary = "List users ready for matching",
            description = "Returns all onboarded users eligible for matching (consumed by the matching-service).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Match-ready users retrieved successfully")
    })
    public ResponseEntity<List<UserMatchResponse>> getReadyForMatch() {
        log.debug("GET /api/users/ready-for-match - fetching match-ready users");
        return ResponseEntity.ok(userProfileService.getReadyForMatch());
    }
}
