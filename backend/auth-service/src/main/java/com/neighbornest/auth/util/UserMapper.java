package com.neighbornest.auth.util;

import com.neighbornest.auth.dto.response.UserResponse;
import com.neighbornest.auth.entity.User;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Utility class for mapping {@link User} entities to {@link UserResponse} DTOs.
 * <p>
 * Provides a single source of truth for user-to-DTO mappings to avoid
 * code duplication across service classes.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class UserMapper {

    /**
     * Maps a {@link User} entity to a {@link UserResponse} DTO.
     * <p>
     * Only exposes non-sensitive fields. The password hash and other
     * internal fields are never included in the response.
     * </p>
     *
     * @param user the user entity to map
     * @return a new {@link UserResponse} containing the user's profile data
     */
    public static UserResponse toResponse(final User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isOnboarded(user.getIsOnboarded())
                .isEmailVerified(user.getIsEmailVerified())
                .city(user.getCity())
                .neighborhood(user.getNeighborhood())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
