package com.neighbornest.auth.service;

import com.neighbornest.auth.dto.request.LoginRequest;
import com.neighbornest.auth.dto.request.LogoutRequest;
import com.neighbornest.auth.dto.request.RefreshTokenRequest;
import com.neighbornest.auth.dto.request.RegisterRequest;
import com.neighbornest.auth.dto.response.AuthResponse;
import com.neighbornest.auth.dto.response.UserResponse;
import com.neighbornest.auth.entity.RefreshToken;
import com.neighbornest.auth.entity.Role;
import com.neighbornest.auth.entity.User;
import com.neighbornest.auth.exception.InvalidCredentialsException;
import com.neighbornest.auth.exception.TokenExpiredException;
import com.neighbornest.auth.exception.UserAlreadyExistsException;
import com.neighbornest.auth.repository.RefreshTokenRepository;
import com.neighbornest.auth.repository.UserRepository;
import com.neighbornest.auth.util.PasswordValidator;
import com.neighbornest.auth.util.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    /**
     * Registers a new user on the NeighborNest platform.
     * <p>
     * Validates the input, checks email uniqueness, encodes the password
     * with BCrypt (strength 12), and saves the user with a default NEWCOMER role.
     * </p>
     *
     * @param request the registration request containing fullName, email, and password
     * @return a {@link UserResponse} containing the newly created user's profile
     * @throws UserAlreadyExistsException if a user with the given email already exists
     */
    @Transactional
    public UserResponse register(final RegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        validateRegistrationRequest(request);

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: email {} already exists", request.getEmail());
            throw new UserAlreadyExistsException("Email " + request.getEmail() + " is already registered");
        }

        final User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.NEWCOMER)
                .isEmailVerified(false)
                .isOnboarded(false)
                .build();

        final User savedUser = userRepository.save(user);
        log.info("User registered successfully with id: {}", savedUser.getId());

        return mapToUserResponse(savedUser);
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
                .expiresIn(refreshExpirationMs / 1000)
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
                .expiresIn(refreshExpirationMs / 1000)
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
     * Maps a {@link User} entity to a {@link UserResponse} DTO using the shared mapper.
     *
     * @param user the user entity to map
     * @return the user response DTO
     */
    private UserResponse mapToUserResponse(final User user) {
        return UserMapper.toResponse(user);
    }
}
