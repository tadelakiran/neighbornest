package com.neighbornest.auth.controller;

import com.neighbornest.auth.dto.response.UserResponse;
import com.neighbornest.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for user profile operations.
 * <p>
 * Provides endpoints for retrieving authenticated user information.
 * All endpoints require a valid JWT token. The current user is
 * extracted from the {@link org.springframework.security.core.context.SecurityContext}
 * via the {@link AuthenticationPrincipal} annotation.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
@RequestMapping(value = "/api/users", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Users", description = "Endpoints for retrieving user profile information")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    /**
     * Retrieves the profile of the currently authenticated user.
     * <p>
     * The user's email is extracted from the {@link AuthenticationPrincipal}
     * (which is populated from the {@link org.springframework.security.core.context.SecurityContext}
     * by the {@link com.neighbornest.auth.security.JwtAuthenticationFilter}),
     * and the user profile is looked up by email.
     * </p>
     *
     * @param principal the authenticated user's details from the SecurityContext
     * @return a {@link ResponseEntity} containing the user's profile data
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current user profile",
            description = "Returns the profile of the currently authenticated user. " +
                    "User identity is extracted from the SecurityContext via @AuthenticationPrincipal. " +
                    "Requires a valid JWT token.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User profile retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT required"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal final UserDetails principal) {

        final String email = principal.getUsername();
        log.debug("GET /api/users/me - fetching current user profile for: {}", email);

        final UserResponse response = userService.getCurrentUserByEmail(email);
        return ResponseEntity.ok(response);
    }
}
