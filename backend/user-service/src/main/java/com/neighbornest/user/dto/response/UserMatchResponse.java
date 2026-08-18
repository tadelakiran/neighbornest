package com.neighbornest.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.user.entity.BudgetLevel;
import com.neighbornest.user.entity.PersonalityType;
import com.neighbornest.user.entity.SchedulePreference;
import com.neighbornest.user.entity.SocialGoal;
import com.neighbornest.user.entity.WorkType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Lightweight profile DTO consumed by the matching-service over Feign.
 * <p>
 * Exposes only the fields the matching engine needs to compute
 * compatibility scores. Never exposes internal entity data.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Profile data used by the matching engine")
public class UserMatchResponse {

    @Schema(description = "Profile ID (used as user ID by the matching engine)", example = "7")
    private Long userId;

    @Schema(description = "User's full name", example = "John Doe")
    private String fullName;

    @Schema(description = "Current city of the user", example = "San Francisco")
    private String city;

    @Schema(description = "URL to the user's profile photo", example = "https://storage.example.com/photos/user1.jpg")
    private String profilePhotoUrl;

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

    @Schema(description = "Onboarding answers used by the scoring engine")
    private List<OnboardingAnswerResponse> onboardingAnswers;
}
