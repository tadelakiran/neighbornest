package com.neighbornest.matching.controller;

import com.neighbornest.matching.client.UserServiceClient;
import com.neighbornest.matching.client.dto.CurrentUserProfileDto;
import com.neighbornest.matching.dto.request.ProposalCreateRequest;
import com.neighbornest.matching.dto.request.ProposalRespondRequest;
import com.neighbornest.matching.dto.response.CompatibilityResponse;
import com.neighbornest.matching.dto.response.MatchProposalResponse;
import com.neighbornest.matching.dto.response.ProposalExecutionResponse;
import com.neighbornest.matching.exception.BadRequestException;
import com.neighbornest.matching.security.AuthenticatedUser;
import com.neighbornest.matching.service.MatchProposalService;
import com.neighbornest.matching.service.MatchingAlgorithmService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for matching operations.
 * <p>
 * Exposes endpoints for compatibility calculation, top compatible users,
 * Nest formation proposals, responses and execution. All endpoints require
 * a valid JWT token.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
@RequestMapping(value = "/api/matching", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Matching", description = "Compatibility scoring and Nest formation endpoints")
@SecurityRequirement(name = "bearerAuth")
public class MatchingController {

    private final MatchingAlgorithmService matchingAlgorithmService;
    private final MatchProposalService matchProposalService;
    private final UserServiceClient userServiceClient;

    /**
     * Triggers compatibility calculation for a user against all eligible users.
     *
     * @param userId the user profile ID
     * @return the number of scores computed
     */
    @PostMapping("/calculate/{userId}")
    @Operation(summary = "Calculate compatibility scores",
            description = "Computes compatibility scores for the given user against all eligible users.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Scores calculated successfully"),
            @ApiResponse(responseCode = "400", description = "User is not eligible for matching"),
            @ApiResponse(responseCode = "503", description = "User-service unavailable")
    })
    public ResponseEntity<Long> calculate(@PathVariable("userId") final Long userId) {
        log.debug("POST /api/matching/calculate/{} - calculating scores", userId);
        final int count = matchingAlgorithmService.calculateForUser(userId);
        return ResponseEntity.ok((long) count);
    }

    /**
     * Returns the top compatible users with scores.
     *
     * @param userId the user profile ID
     * @return the ordered list of compatibility responses
     */
    @GetMapping("/compatibles/{userId}")
    @Operation(summary = "Get top compatible users",
            description = "Returns the top-N compatible users with their scores for a user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Compatibles retrieved successfully")
    })
    public ResponseEntity<List<CompatibilityResponse>> getCompatibles(@PathVariable("userId") final Long userId) {

        log.debug("GET /api/matching/compatibles/{} - fetching compatibles", userId);
        return ResponseEntity.ok(matchingAlgorithmService.getTopCompatibles(userId));
    }

    /**
     * Creates a Nest formation proposal.
     *
     * @param principal the authenticated user from the JWT
     * @param request   the proposal creation request
     * @return the created proposal with status 201 CREATED
     */
    @PostMapping("/propose")
    @Operation(summary = "Create Nest proposal",
            description = "Creates a Nest formation proposal from a list of user IDs and optional anchors.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Proposal created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    public ResponseEntity<MatchProposalResponse> propose(
            @AuthenticationPrincipal final AuthenticatedUser principal,
            @Valid @RequestBody final ProposalCreateRequest request) {

        log.debug("POST /api/matching/propose - creating proposal");
        final MatchProposalResponse response = matchProposalService.createProposal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Records a user's response to a proposal.
     *
     * @param proposalId the proposal ID
     * @param principal  the authenticated user from the JWT
     * @param request    the response request
     * @return the updated proposal
     */
    @PostMapping("/proposals/{proposalId}/respond")
    @Operation(summary = "Respond to proposal",
            description = "Accepts or declines a Nest formation proposal.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Response recorded successfully"),
            @ApiResponse(responseCode = "400", description = "Proposal closed, expired, or user not a member")
    })
    public ResponseEntity<MatchProposalResponse> respond(
            @PathVariable("proposalId") final Long proposalId,
            @AuthenticationPrincipal final AuthenticatedUser principal,
            @Valid @RequestBody final ProposalRespondRequest request) {

        log.debug("POST /api/matching/proposals/{}/respond", proposalId);
        return ResponseEntity.ok(matchProposalService.respond(proposalId, resolveProfileId(principal), request.getAccept()));
    }

    /**
     * Returns all pending proposals for a user.
     *
     * @param userId the user profile ID
     * @return the list of pending proposals
     */
    @GetMapping("/proposals/pending/{userId}")
    @Operation(summary = "Get pending proposals",
            description = "Returns all pending Nest formation proposals for a user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pending proposals retrieved successfully")
    })
    public ResponseEntity<List<MatchProposalResponse>> getPendingProposals(@PathVariable("userId") final Long userId) {
        log.debug("GET /api/matching/proposals/pending/{}", userId);
        return ResponseEntity.ok(matchProposalService.getPendingProposals(userId));
    }

    /**
     * Translates the JWT principal (auth-service user id) into the caller's
     * <em>profile</em> id via the user-service, so member-scoped operations
     * compare against the id space the proposal members actually use.
     *
     * @param principal the authenticated user from the JWT
     * @return the caller's user-service profile id
     * @throws BadRequestException if no profile can be resolved
     */
    private Long resolveProfileId(final AuthenticatedUser principal) {
        final CurrentUserProfileDto profile = userServiceClient.getMyProfile();
        if (profile == null || profile.getId() == null) {
            log.warn("Could not resolve profile id for auth user {}", principal.userId());
            throw new BadRequestException("Could not resolve your user profile. Complete your profile first.");
        }
        return profile.getId();
    }

    /**
     * Executes an accepted proposal by creating a Nest.
     *
     * @param proposalId the proposal ID
     * @return the execution result including the Nest ID
     */
    @PostMapping("/execute/{proposalId}")
    @Operation(summary = "Execute accepted proposal",
            description = "Triggers Nest creation in the nest-service for a fully accepted proposal.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Proposal executed successfully"),
            @ApiResponse(responseCode = "400", description = "Proposal is not in ACCEPTED status"),
            @ApiResponse(responseCode = "503", description = "Nest-service unavailable")
    })
    public ResponseEntity<ProposalExecutionResponse> execute(@PathVariable("proposalId") final Long proposalId) {
        log.debug("POST /api/matching/execute/{} - executing proposal", proposalId);
        return ResponseEntity.ok(matchProposalService.execute(proposalId));
    }
}
