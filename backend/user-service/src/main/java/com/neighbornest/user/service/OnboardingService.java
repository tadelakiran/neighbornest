package com.neighbornest.user.service;

import com.neighbornest.user.dto.request.OnboardingSubmitRequest;
import com.neighbornest.user.dto.response.ProfileResponse;
import com.neighbornest.user.entity.OnboardingAnswer;
import com.neighbornest.user.entity.UserProfile;
import com.neighbornest.user.exception.ResourceNotFoundException;
import com.neighbornest.user.repository.OnboardingAnswerRepository;
import com.neighbornest.user.repository.UserProfileRepository;
import com.neighbornest.user.util.UserProfileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling the onboarding questionnaire.
 * <p>
 * Persists the user's onboarding answers (replacing any previous answers)
 * and marks the profile as onboarded once the questionnaire is submitted.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OnboardingService {

    private final UserProfileRepository userProfileRepository;
    private final OnboardingAnswerRepository onboardingAnswerRepository;
    private final UserProfileMapper userProfileMapper;

    /**
     * Submits onboarding answers for the authenticated user and marks the
     * profile as onboarded.
     *
     * @param authUserId the auth-service user ID from the JWT
     * @param request    the onboarding submission request
     * @return the updated profile with answers
     * @throws ResourceNotFoundException if the profile does not exist
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "userProfiles", key = "#authUserId"),
            @CacheEvict(value = "onboardingStatus", key = "#authUserId"),
            @CacheEvict(value = "publicProfiles", allEntries = true),
            @CacheEvict(value = "readyForMatch", allEntries = true)
    })
    public ProfileResponse submitOnboarding(final Long authUserId, final OnboardingSubmitRequest request) {
        final UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user id: " + authUserId));

        log.info("Submitting onboarding answers for authUserId: {}", authUserId);

        // Replace any previously recorded answers
        onboardingAnswerRepository.deleteByUserProfileId(profile.getId());

        final List<OnboardingAnswer> answers = request.getAnswers().stream()
                .map(answer -> OnboardingAnswer.builder()
                        .userProfileId(profile.getId())
                        .questionKey(answer.getQuestionKey())
                        .answerValue(answer.getAnswerValue())
                        .weight(answer.getWeight())
                        .build())
                .toList();

        onboardingAnswerRepository.saveAll(answers);

        profile.setOnboarded(true);
        userProfileRepository.save(profile);

        log.info("Onboarding completed for authUserId: {}", authUserId);

        return userProfileMapper.toProfileResponse(profile, answers);
    }
}
