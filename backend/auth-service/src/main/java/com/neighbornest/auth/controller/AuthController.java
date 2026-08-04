package com.neighbornest.auth.controller;

import com.neighbornest.auth.dto.request.LoginRequest;
import com.neighbornest.auth.dto.request.LogoutRequest;
import com.neighbornest.auth.dto.request.RefreshTokenRequest;
import com.neighbornest.auth.dto.request.RegisterRequest;
import com.neighbornest.auth.dto.response.AuthResponse;
import com.neighbornest.auth.dto.response.AuthValidationResponse;
import com.neighbornest.auth.dto.response.UserResponse;
import com.neighbornest.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for authentication operations.
 * <p>
 * Provides endpoints for user registration, login, token refresh,
 * and logout. All endpoints are publicly accessible (no JWT required).
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
@RequestMapping(value = "/api/auth", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Endpoints for user authentication and token management")
public class AuthController {

    private final AuthService authService;

    /**
     * Registers a new user on the NeighborNest platform.
     *
     * @param request the registration request containing fullName, email, and password
     * @return a {@link ResponseEntity} containing the new user's profile with status 201 CREATED
     */
    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account with NEWCOMER role")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "409", description = "Email already registered")
    })
    public ResponseEntity<UserResponse> register(@Valid @RequestBody final RegisterRequest request) {
        log.debug("POST /api/auth/register - registering user: {}", request.getEmail());
        final UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Authenticates a user and returns JWT tokens.
     *
     * @param request the login request containing email and password
     * @return a {@link ResponseEntity} containing access and refresh tokens
     */
    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticates user credentials and returns JWT access and refresh tokens")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful, tokens returned"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody final LoginRequest request) {
        log.debug("POST /api/auth/login - login attempt for: {}", request.getEmail());
        final AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Refreshes an expired access token using a valid refresh token.
     *
     * @param request the refresh token request
     * @return a {@link ResponseEntity} containing new access and refresh tokens
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token",
            description = "Obtains a new access token using a valid refresh token. Also rotates the refresh token.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody final RefreshTokenRequest request) {
        log.debug("POST /api/auth/refresh - refreshing token");
        final AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Logs out the user by invalidating their refresh token.
     *
     * @param request the logout request optionally containing the refresh token
     * @return a {@link ResponseEntity} with a success message
     */
    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Invalidates the refresh token and logs out the user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logout successful"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT required")
    })
    public ResponseEntity<String> logout(@RequestBody(required = false) final LogoutRequest request) {
        log.debug("POST /api/auth/logout - logging out user");
        authService.logout(request);
        return ResponseEntity.ok("Logout successful");
    }

    /**
     * Validates a JWT token and returns the owning user's identity.
     * <p>
     * Consumed by other services (e.g. user-service) via Feign to confirm
     * token ownership. Returns {@code valid: false} with 200 for invalid or
     * expired tokens so callers can degrade gracefully without an exception.
     * </p>
     *
     * @param token the raw JWT to validate
     * @return a {@link ResponseEntity} containing the validation result
     */
    @GetMapping("/validate")
    @Operation(summary = "Validate a JWT token",
            description = "Validates a JWT and returns the owning user's id, email, and role. " +
                    "Used by other services to confirm token ownership.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Validation result (valid true/false)")
    })
    public ResponseEntity<AuthValidationResponse> validate(
            @RequestParam("token") final String token) {
        log.debug("GET /api/auth/validate - validating token");
        return ResponseEntity.ok(authService.validateToken(token));
    }
}
