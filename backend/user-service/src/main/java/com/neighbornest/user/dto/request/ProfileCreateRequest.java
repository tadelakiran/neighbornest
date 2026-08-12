package com.neighbornest.user.dto.request;

import com.neighbornest.user.entity.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new user profile.
 * <p>
 * The {@code authUserId} is intentionally omitted here — it is resolved from
 * the authenticated JWT so callers cannot claim another user's identity.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for creating a user profile")
public class ProfileCreateRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Schema(description = "User's full name", example = "John Doe", requiredMode = Schema.RequiredMode.REQUIRED)
    private String fullName;

    @Schema(description = "URL to the user's profile photo", example = "https://storage.example.com/photos/user1.jpg")
    @Size(max = 500, message = "Profile photo URL must not exceed 500 characters")
    private String profilePhotoUrl;

    // Optional on creation so the auth flow can provision a minimal profile at
    // registration; onboarding later fills city/neighborhood/occupation in.
    @Size(max = 100, message = "City must not exceed 100 characters")
    @Schema(description = "Current city of the user", example = "San Francisco")
    private String city;

    @Size(max = 100, message = "Neighborhood must not exceed 100 characters")
    @Schema(description = "Neighborhood within the city", example = "Mission District")
    private String neighborhood;

    @Min(value = 0, message = "Years in city cannot be negative")
    @Schema(description = "Number of years the user has lived in the city", example = "1")
    private int yearsInCity;

    @Size(max = 100, message = "Occupation must not exceed 100 characters")
    @Schema(description = "User's occupation", example = "Software Engineer")
    private String occupation;

    @Schema(description = "Platform role for the profile")
    private UserRole role;
}
