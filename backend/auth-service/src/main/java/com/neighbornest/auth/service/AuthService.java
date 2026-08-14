package com.neighbornest.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.auth.client.NotificationEmailClient;
import com.neighbornest.auth.dto.request.LoginRequest;
import com.neighbornest.auth.dto.request.LogoutRequest;
import com.neighbornest.auth.dto.request.RefreshTokenRequest;
import com.neighbornest.auth.dto.request.RegisterRequest;
import com.neighbornest.auth.dto.request.SendOtpRequest;
import com.neighbornest.auth.dto.request.VerifyOtpRequest;
import com.neighbornest.auth.dto.request.WelcomeEmailRequest;
import com.neighbornest.auth.dto.response.AuthResponse;
import com.neighbornest.auth.dto.response.AuthValidationResponse;
import com.neighbornest.auth.dto.response.OtpSendResponse;
import com.neighbornest.auth.dto.response.OtpVerifyResponse;
import com.neighbornest.auth.dto.response.UserResponse;
import com.neighbornest.auth.entity.RefreshToken;
import com.neighbornest.auth.entity.Role;
import com.neighbornest.auth.entity.User;
import com.neighbornest.auth.enums.OtpPurpose;
import com.neighbornest.auth.exception.BadRequestException;
import com.neighbornest.auth.exception.InvalidCredentialsException;
import com.neighbornest.auth.exception.TokenExpiredException;
import com.neighbornest.auth.exception.UserAlreadyExistsException;
import com.neighbornest.auth.repository.RefreshTokenRepository;
import com.neighbornest.auth.repository.UserRepository;
import com.neighbornest.auth.util.PasswordValidator;
import com.neighbornest.auth.util.UserMapper;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service handling authentication operations for the NeighborNest platform.
 * <p>
 * Implements user registration, login, token refresh, and logout logic.
 * All business rules for authentication are enforced within this service.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationEmailClient notificationEmailClient;
    private final ObjectMapper objectMapper;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${app.jwt.expiration-ms}")
    private long accessExpirationMs;

    /**
     * Registers a new user on the NeighborNest platform.
     * <p>
     * Validates the input, checks email uniqueness, redeems the email-verification
     * OTP (proving the user owns the address), encodes the password with BCrypt,
     * and saves the user as email-verified with a default NEWCOMER role. A welcome
     * email is then requested from the email service (best-effort).
     * </p>
     *
     * @param request the registration request containing fullName, email, password, and otp
     * @return a {@link UserResponse} containing the newly created user's profile
     * @throws UserAlreadyExistsException if a user with the given email already exists
     * @throws BadRequestException        if the OTP is missing, expired, or wrong
     */
    @Transactional
    public UserResponse register(final RegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        validateRegistrationRequest(request);

        final String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration failed: email {} already exists", email);
            throw new UserAlreadyExistsException("Email " + email + " is already registered");
        }

        // Email ownership is proven by the code the user entered.
        verifyEmailOtp(email, request.getOtp());

        final User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.NEWCOMER)
                .isEmailVerified(true)
                .isOnboarded(false)
                .build();

        final User savedUser = userRepository.save(user);
        log.info("User registered successfully with id: {}", savedUser.getId());

        // Best-effort welcome email — never block registration on it.
        try {
            notificationEmailClient.sendWelcome(WelcomeEmailRequest.builder()
                    .email(email)
                    .fullName(savedUser.getFullName())
                    .build());
        } catch (final Exception e) {
            log.warn("Welcome email for {} could not be dispatched: {}", email, e.getMessage());
        }

        return mapToUserResponse(savedUser);
    }

    /**
     * Emails a one-time passcode for the requested purpose (registration
     * verification). Delegates generation, storage, throttling, and delivery
     * to the notification-service email endpoints.
     *
     * @param request the email + purpose
     * @return metadata about the issued code (never the code itself)
     */
    public OtpSendResponse sendOtp(final SendOtpRequest request) {
        try {
            final OtpSendResponse response = notificationEmailClient.sendOtp(request);
            if (response == null) {
                throw new BadRequestException("We couldn't send the verification code. Please try again.");
            }
            return response;
        } catch (final FeignException e) {
            final String reason = extractFeignMessage(e);
            throw new BadRequestException(
                    reason != null ? reason : "We couldn't send the verification code. Please try again.");
        }
    }

    /**
     * Authenticates a user with email and password.
     * <p>
     * Validates credentials, generates a JWT access token (15 min expiry),
     * and creates a refresh token (7 days) stored in the database.
     * </p>
     *
     * @param request the login request containing email and password
     * @return an {@link AuthResponse} containing access and refresh tokens
     * @throws InvalidCredentialsException if the email or password is incorrect
     */
    @Transactional
    public AuthResponse login(final LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        final User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> {
                    log.warn("Login failed: no user found with email {}", request.getEmail());
                    return new InvalidCredentialsException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed: incorrect password for email {}", request.getEmail());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        final String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(), user.getIsOnboarded());

        final RefreshToken refreshToken = createRefreshToken(user);

        log.info("User logged in successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                // expires_in describes the ACCESS token lifetime (the value the
                // client actually acts on), not the refresh token's 7-day TTL.
                .expiresIn(accessExpirationMs / 1000)
                .build();
    }

    /**
     * Refreshes an expired or expiring access token using a valid refresh token.
     * <p>
     * Validates the refresh token, generates a new access token, and
     * rotates the refresh token for security purposes.
     * </p>
     *
     * @param request the refresh token request
     * @return an {@link AuthResponse} containing new access and refresh tokens
     * @throws TokenExpiredException if the refresh token is expired or invalid
     */
    @Transactional
    public AuthResponse refresh(final RefreshTokenRequest request) {
        log.debug("Processing token refresh request");

        final RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> {
                    log.warn("Token refresh failed: refresh token not found");
                    return new TokenExpiredException("Invalid refresh token");
                });

        if (storedToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            log.warn("Token refresh failed: refresh token expired");
            throw new TokenExpiredException("Refresh token has expired. Please login again.");
        }

        final User user = storedToken.getUser();

        // Delete the old refresh token (rotation)
        refreshTokenRepository.delete(storedToken);

        // Generate new tokens
        final String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(), user.getIsOnboarded());

        final RefreshToken newRefreshToken = createRefreshToken(user);

        log.info("Tokens refreshed successfully for user: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                // Same as login: expires_in is the access-token TTL in seconds.
                .expiresIn(accessExpirationMs / 1000)
                .build();
    }

    /**
     * Logs out the user by invalidating their refresh token.
     *
     * @param request the logout request optionally containing the refresh token (may be null)
     */
    @Transactional
    public void logout(final LogoutRequest request) {
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            refreshTokenRepository.findByToken(request.getRefreshToken())
                    .ifPresent(token -> {
                        refreshTokenRepository.delete(token);
                        log.debug("Refresh token invalidated for user: {}", token.getUser().getId());
                    });
        }
        log.info("User logged out successfully");
    }

    /**
     * Creates and persists a new refresh token for the given user.
     *
     * @param user the user to create the refresh token for
     * @return the persisted {@link RefreshToken}
     */
    private RefreshToken createRefreshToken(final User user) {
        final RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Validates the registration request fields.
     *
     * @param request the registration request to validate
     */
    private void validateRegistrationRequest(final RegisterRequest request) {
        final List<String> passwordErrors = PasswordValidator.validate(request.getPassword());
        if (!passwordErrors.isEmpty()) {
            throw new IllegalArgumentException("Password validation failed: " + String.join("; ", passwordErrors));
        }
    }

    /**
     * Redeems the email-verification OTP through the email service.
     *
     * @param email the normalized address being registered
     * @param otp   the 6-digit code the user entered
     * @throws BadRequestException if the code is missing, expired, or wrong
     */
    private void verifyEmailOtp(final String email, final String otp) {
        try {
            final OtpVerifyResponse response = notificationEmailClient.verifyOtp(VerifyOtpRequest.builder()
                    .email(email)
                    .purpose(OtpPurpose.EMAIL_VERIFICATION)
                    .otp(otp)
                    .build());
            if (response == null || !response.isValid()) {
                throw new BadRequestException("Invalid or expired verification code.");
            }
        } catch (final FeignException e) {
            // The email service's 400 carries the precise reason (expired,
            // attempts remaining) — surface it instead of a generic message.
            final String reason = extractFeignMessage(e);
            throw new BadRequestException(
                    reason != null ? reason : "Invalid or expired verification code.");
        }
    }

    /**
     * Extracts the {@code message} field from a Feign error response body, so
     * the email service's precise reason can be surfaced to the user.
     *
     * @param e the Feign exception
     * @return the upstream message, or {@code null} if it cannot be parsed
     */
    private String extractFeignMessage(final FeignException e) {
        try {
            return e.responseBody()
                    .map(buffer -> {
                        final byte[] bytes = new byte[buffer.remaining()];
                        buffer.get(bytes);
                        try {
                            final JsonNode node = objectMapper.readTree(
                                    new String(bytes, StandardCharsets.UTF_8));
                            return node.path("message").asText(null);
                        } catch (final Exception ex) {
                            return null;
                        }
                    })
                    .orElse(null);
        } catch (final Exception ex) {
            return null;
        }
    }

    /**
     * Maps a {@link User} entity to a {@link UserResponse} DTO using the shared mapper.
     *
     * @param user the user entity to map
     * @return the user response DTO
     */
    private UserResponse mapToUserResponse(final User user) {
        return UserMapper.toResponse(user);
    }

    /**
     * Validates a JWT token and resolves the owning user.
     * <p>
     * Invalid, expired, or malformed tokens (and tokens whose user no longer
     * exists) return {@code valid: false} instead of throwing, so downstream
     * services can degrade gracefully.
     * </p>
     *
     * @param token the raw JWT to validate
     * @return the validation result including user id, email, and role
     */
    public AuthValidationResponse validateToken(final String token) {
        if (token == null || token.isBlank() || !jwtService.validateToken(token)) {
            return AuthValidationResponse.builder().valid(false).build();
        }

        final Long userId = jwtService.extractUserId(token);
        final User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("Token validation failed: no user found for id {}", userId);
            return AuthValidationResponse.builder().valid(false).build();
        }

        return AuthValidationResponse.builder()
                .valid(true)
                .userId(userId)
                .email(user.getEmail())
                .role(user.getRole().name())
                .onboarded(user.getIsOnboarded())
                .build();
    }
}
