package com.neighbornest.auth.controller;

import com.neighbornest.auth.dto.request.ForgotPasswordRequest;
import com.neighbornest.auth.dto.request.LoginRequest;
import com.neighbornest.auth.dto.request.LogoutRequest;
import com.neighbornest.auth.dto.request.RefreshTokenRequest;
import com.neighbornest.auth.dto.request.RegisterRequest;
import com.neighbornest.auth.dto.request.ResetPasswordRequest;
import com.neighbornest.auth.dto.request.SendOtpRequest;
import com.neighbornest.auth.dto.response.AuthResponse;
import com.neighbornest.auth.dto.response.AuthValidationResponse;
import com.neighbornest.auth.dto.response.OtpSendResponse;
import com.neighbornest.auth.dto.response.UserResponse;
import com.neighbornest.auth.service.AuthService;
import com.neighbornest.auth.service.PasswordService;
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
    private final PasswordService passwordService;

    /**
     * Emails a one-time passcode to verify an email address during registration.
     *
     * @param request the email + purpose
     * @return metadata about the issued code (never the code itself)
     */
    @PostMapping("/otp/send")
    @Operation(summary = "Send email verification code",
            description = "Emails a 6-digit code to prove ownership of an email address before registration completes.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Code issued and emailed"),
            @ApiResponse(responseCode = "400", description = "Invalid input or code requested too soon")
    })
    public OtpSendResponse sendOtp(@Valid @RequestBody final SendOtpRequest request) {
        log.debug("POST /api/auth/otp/send - purpose {} for {}", request.getPurpose(), request.getEmail());
        return authService.sendOtp(request);
    }

    /**
     * Emails a password-reset code if an account exists for the address.
     * <p>
     * Always responds with the same success message so the endpoint never
     * reveals whether an email address is registered.
     * </p>
     *
     * @param request the account email address
     * @return a generic success message
     */
    @PostMapping("/password/forgot")
    @Operation(summary = "Request password reset code",
            description = "Emails a 6-digit reset code if an account exists for the address. " +
                    "Always returns success to avoid leaking which emails are registered.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reset code dispatched (if the account exists)"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody final ForgotPasswordRequest request) {
        log.debug("POST /api/auth/password/forgot - requested for {}", request.getEmail());
        passwordService.forgotPassword(request.getEmail());
        return ResponseEntity.ok("If an account exists for that email, a reset code is on its way.");
    }

    /**
     * Completes a password reset using the emailed code.
     *
     * @param request the email, code, and new password
     * @return a success message
     */
    @PostMapping("/password/reset")
    @Operation(summary = "Reset password with code",
            description = "Verifies the emailed reset code and updates the account password.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password updated"),
            @ApiResponse(responseCode = "400", description = "Invalid, expired, or wrong code; weak new password")
    })
    public ResponseEntity<String> resetPassword(@Valid @RequestBody final ResetPasswordRequest request) {
        log.debug("POST /api/auth/password/reset - requested for {}", request.getEmail());
        passwordService.resetPassword(request);
        return ResponseEntity.ok("Password updated. You can now sign in with your new password.");
    }

    /**
     * Registers a new user on the NeighborNest platform.
     *
     * @param request the registration request containing fullName, email, password, and otp
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
