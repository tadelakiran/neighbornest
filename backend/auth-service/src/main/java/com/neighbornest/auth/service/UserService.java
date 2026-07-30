package com.neighbornest.auth.service;

import com.neighbornest.auth.dto.response.UserResponse;
import com.neighbornest.auth.entity.User;
import com.neighbornest.auth.exception.ResourceNotFoundException;
import com.neighbornest.auth.repository.UserRepository;
import com.neighbornest.auth.util.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service handling user profile operations.
 * <p>
 * Provides methods for retrieving user information, primarily
 * the authenticated user's profile. All user data is returned
 * as DTOs to avoid exposing sensitive entity fields.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Retrieves the profile of the currently authenticated user by their email.
     * <p>
     * The email is extracted from the SecurityContext via the
     * {@link org.springframework.security.core.annotation.AuthenticationPrincipal}
     * annotation in the controller.
     * </p>
     *
     * @param email the email address of the user to retrieve
     * @return a {@link UserResponse} containing the user's profile data
     * @throws ResourceNotFoundException if no user is found with the given email
     */
    public UserResponse getCurrentUserByEmail(final String email) {
        log.debug("Fetching user profile for email: {}", email);

        final User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> {
                    log.error("User not found with email: {}", email);
                    return new ResourceNotFoundException("User not found with email: " + email);
                });

        log.debug("User profile retrieved successfully for: {}", email);
        return mapToUserResponse(user);
    }

    /**
     * Maps a {@link User} entity to a {@link UserResponse} DTO using the shared mapper.
     *
     * @param user the user entity to map
     * @return the user response DTO with sensitive fields excluded
     */
    private UserResponse mapToUserResponse(final User user) {
        return UserMapper.toResponse(user);
    }
}
