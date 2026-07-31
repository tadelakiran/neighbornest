package com.neighbornest.user.dto.request;

import com.neighbornest.user.entity.BudgetLevel;
import com.neighbornest.user.entity.PersonalityType;
import com.neighbornest.user.entity.SchedulePreference;
import com.neighbornest.user.entity.SocialGoal;
import com.neighbornest.user.entity.UserRole;
import com.neighbornest.user.entity.WorkType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating an existing user profile.
 * <p>
 * All fields are optional so a client can perform partial updates.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for updating a user profile")
public class ProfileUpdateRequest {

    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Schema(description = "User's full name", example = "John Doe")
    private String fullName;

    @Size(max = 500, message = "Profile photo URL must not exceed 500 characters")
    @Schema(description = "URL to the user's profile photo", example = "https://storage.example.com/photos/user1.jpg")
    private String profilePhotoUrl;

    @Size(max = 100, message = "City must not exceed 100 characters")
    @Schema(description = "Current city of the user", example = "San Francisco")
    private String city;

    @Size(max = 100, message = "Neighborhood must not exceed 100 characters")
    @Schema(description = "Neighborhood within the city", example = "Mission District")
    private String neighborhood;

    @Min(value = 0, message = "Years in city cannot be negative")
    @Schema(description = "Number of years the user has lived in the city", example = "2")
    private Integer yearsInCity;

    @Size(max = 100, message = "Occupation must not exceed 100 characters")
    @Schema(description = "User's occupation", example = "Product Manager")
    private String occupation;

    @Schema(description = "Employment type", example = "FULL_TIME")
    private WorkType workType;

    @Schema(description = "Self-reported personality type", example = "AMBIVERT")
    private PersonalityType personalityType;

    @Schema(description = "Preferred daily schedule", example = "FLEXIBLE")
    private SchedulePreference schedulePreference;

    @Schema(description = "Primary social goal", example = "FRIENDSHIP")
    private SocialGoal socialGoal;

    @Schema(description = "Comfortable budget level", example = "MEDIUM")
    private BudgetLevel budgetLevel;

    @Schema(description = "Platform role for the profile", example = "ANCHOR")
    private UserRole role;
}
