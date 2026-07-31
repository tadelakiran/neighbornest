package com.neighbornest.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.user.entity.BudgetLevel;
import com.neighbornest.user.entity.PersonalityType;
import com.neighbornest.user.entity.SchedulePreference;
import com.neighbornest.user.entity.SocialGoal;
import com.neighbornest.user.entity.UserRole;
import com.neighbornest.user.entity.WorkType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a user profile including onboarding answers.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Full user profile data")
public class ProfileResponse {

    @Schema(description = "Profile ID", example = "1")
    private Long id;

    @Schema(description = "Linked auth-service user ID", example = "42")
    @JsonProperty("auth_user_id")
    private Long authUserId;

    @Schema(description = "User's full name", example = "John Doe")
    @JsonProperty("full_name")
    private String fullName;

    @Schema(description = "URL to the user's profile photo", example = "https://storage.example.com/photos/user1.jpg")
    @JsonProperty("profile_photo_url")
    private String profilePhotoUrl;

    @Schema(description = "Current city of the user", example = "San Francisco")
    private String city;

    @Schema(description = "Neighborhood within the city", example = "Mission District")
    private String neighborhood;

    @Schema(description = "Number of years the user has lived in the city", example = "1")
    @JsonProperty("years_in_city")
    private int yearsInCity;

    @Schema(description = "User's occupation", example = "Software Engineer")
    private String occupation;

    @Schema(description = "Employment type", example = "FULL_TIME")
    @JsonProperty("work_type")
    private WorkType workType;

    @Schema(description = "Self-reported personality type", example = "AMBIVERT")
    @JsonProperty("personality_type")
    private PersonalityType personalityType;

    @Schema(description = "Preferred daily schedule", example = "FLEXIBLE")
    @JsonProperty("schedule_preference")
    private SchedulePreference schedulePreference;

    @Schema(description = "Primary social goal", example = "FRIENDSHIP")
    @JsonProperty("social_goal")
    private SocialGoal socialGoal;

    @Schema(description = "Comfortable budget level", example = "MEDIUM")
    @JsonProperty("budget_level")
    private BudgetLevel budgetLevel;

    @Schema(description = "Whether the user has completed onboarding", example = "true")
    @JsonProperty("is_onboarded")
    private boolean isOnboarded;

    @Schema(description = "Platform role of the user", example = "NEWCOMER")
    private UserRole role;

    @Schema(description = "Onboarding answers for this profile")
    private List<OnboardingAnswerResponse> onboardingAnswers;

    @Schema(description = "Timestamp when the profile was created", example = "2025-01-15T10:30:00")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the profile was last updated", example = "2025-01-20T10:30:00")
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}
