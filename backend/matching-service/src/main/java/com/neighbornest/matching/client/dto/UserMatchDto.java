package com.neighbornest.matching.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * External DTO mirroring the {@code UserMatchResponse} payload returned by
 * the user-service. Consumed by the matching engine to fetch eligible users
 * and their onboarding data.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMatchDto {

    /** User profile ID (used as the user ID throughout the matching engine). */
    private Long userId;

    private String fullName;

    private String city;

    /** Profile photo URL used to enrich compatibles/proposal members. */
    private String profilePhotoUrl;

    @JsonProperty("work_type")
    private String workType;

    @JsonProperty("personality_type")
    private String personalityType;

    @JsonProperty("schedule_preference")
    private String schedulePreference;

    @JsonProperty("social_goal")
    private String socialGoal;

    @JsonProperty("budget_level")
    private String budgetLevel;

    /** Onboarding answers used by the scoring engine. */
    private List<OnboardingAnswerDto> onboardingAnswers;
}
