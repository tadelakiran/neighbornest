package com.neighbornest.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.auth.entity.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO representing a user profile.
 * <p>
 * Used for returning user data in API responses. Never exposes
 * sensitive fields like the password hash.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User profile data")
public class UserResponse {

    @Schema(description = "User ID", example = "1")
    private Long id;

    @Schema(description = "User's email address", example = "john.doe@example.com")
    private String email;

    @Schema(description = "User's full name", example = "John Doe")
    @JsonProperty("full_name")
    private String fullName;

    @Schema(description = "User's role in the platform", example = "NEWCOMER")
    private Role role;

    @Schema(description = "Whether the user has completed onboarding", example = "false")
    @JsonProperty("is_onboarded")
    private Boolean isOnboarded;

    @Schema(description = "Whether the user's email has been verified", example = "false")
    @JsonProperty("is_email_verified")
    private Boolean isEmailVerified;

    @Schema(description = "User's city", example = "San Francisco")
    private String city;

    @Schema(description = "User's neighborhood", example = "Mission District")
    private String neighborhood;

    @Schema(description = "URL to the user's profile photo", example = "https://storage.example.com/photos/user1.jpg")
    @JsonProperty("profile_photo_url")
    private String profilePhotoUrl;

    @Schema(description = "Timestamp when the user was created", example = "2025-01-15T10:30:00")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
