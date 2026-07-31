package com.neighbornest.user.util;

import com.neighbornest.user.dto.response.OnboardingAnswerResponse;
import com.neighbornest.user.dto.response.ProfileResponse;
import com.neighbornest.user.dto.response.UserMatchResponse;
import com.neighbornest.user.entity.OnboardingAnswer;
import com.neighbornest.user.entity.UserProfile;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper for converting {@link UserProfile} entities to response DTOs.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
public class UserProfileMapper {

    /**
     * Maps a profile entity plus its answers to a {@link ProfileResponse}.
     *
     * @param profile the profile entity
     * @param answers the profile's onboarding answers
     * @return the response DTO
     */
    public ProfileResponse toProfileResponse(final UserProfile profile, final List<OnboardingAnswer> answers) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .authUserId(profile.getAuthUserId())
                .fullName(profile.getFullName())
                .profilePhotoUrl(profile.getProfilePhotoUrl())
                .city(profile.getCity())
                .neighborhood(profile.getNeighborhood())
                .yearsInCity(profile.getYearsInCity())
                .occupation(profile.getOccupation())
                .workType(profile.getWorkType())
                .personalityType(profile.getPersonalityType())
                .schedulePreference(profile.getSchedulePreference())
                .socialGoal(profile.getSocialGoal())
                .budgetLevel(profile.getBudgetLevel())
                .isOnboarded(profile.isOnboarded())
                .role(profile.getRole())
                .onboardingAnswers(toAnswerResponses(answers))
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    /**
     * Maps a profile entity to the lightweight {@link UserMatchResponse}
     * consumed by the matching-service.
     *
     * @param profile the profile entity
     * @param answers the profile's onboarding answers
     * @return the match DTO
     */
    public UserMatchResponse toMatchResponse(final UserProfile profile, final List<OnboardingAnswer> answers) {
        return UserMatchResponse.builder()
                .userId(profile.getId())
                .fullName(profile.getFullName())
                .city(profile.getCity())
                .workType(profile.getWorkType())
                .personalityType(profile.getPersonalityType())
                .schedulePreference(profile.getSchedulePreference())
                .socialGoal(profile.getSocialGoal())
                .budgetLevel(profile.getBudgetLevel())
                .onboardingAnswers(toAnswerResponses(answers))
                .build();
    }

    /**
     * Maps a list of answer entities to response DTOs.
     *
     * @param answers the answer entities
     * @return the response DTOs
     */
    public List<OnboardingAnswerResponse> toAnswerResponses(final List<OnboardingAnswer> answers) {
        return answers.stream()
                .map(answer -> OnboardingAnswerResponse.builder()
                        .questionKey(answer.getQuestionKey())
                        .answerValue(answer.getAnswerValue())
                        .weight(answer.getWeight())
                        .build())
                .toList();
    }
}
