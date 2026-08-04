package com.neighbornest.user.service;

import com.neighbornest.user.dto.request.OnboardingAnswerRequest;
import com.neighbornest.user.dto.request.OnboardingSubmitRequest;
import com.neighbornest.user.dto.response.ProfileResponse;
import com.neighbornest.user.entity.OnboardingAnswer;
import com.neighbornest.user.entity.UserProfile;
import com.neighbornest.user.exception.ResourceNotFoundException;
import com.neighbornest.user.repository.OnboardingAnswerRepository;
import com.neighbornest.user.repository.UserProfileRepository;
import com.neighbornest.user.util.UserProfileMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link OnboardingService}.
 * <p>
 * Plain Mockito tests — repositories and the mapper are mocked so the
 * onboarding flow is exercised in isolation.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OnboardingService Unit Tests")
class OnboardingServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private OnboardingAnswerRepository onboardingAnswerRepository;

    @Mock
    private UserProfileMapper userProfileMapper;

    private OnboardingService service;

    private static final Long AUTH_USER_ID = 42L;

    @BeforeEach
    void setUp() {
        service = new OnboardingService(userProfileRepository, onboardingAnswerRepository, userProfileMapper);
    }

    @Nested
    @DisplayName("submitOnboarding method")
    class SubmitOnboardingTests {

        @Test
        @DisplayName("Should replace previous answers and mark the profile as onboarded")
        void shouldSubmitOnboardingSuccessfully() {
            final UserProfile profile = UserProfile.builder()
                    .id(7L)
                    .authUserId(AUTH_USER_ID)
                    .fullName("John Doe")
                    .build();

            final OnboardingSubmitRequest request = OnboardingSubmitRequest.builder()
                    .answers(List.of(
                            OnboardingAnswerRequest.builder()
                                    .questionKey("values_adventure")
                                    .answerValue("5")
                                    .weight(3)
                                    .build(),
                            OnboardingAnswerRequest.builder()
                                    .questionKey("interest_hiking")
                                    .answerValue("4")
                                    .weight(2)
                                    .build()))
                    .build();

            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile));
            when(userProfileMapper.toProfileResponse(any(UserProfile.class), anyList()))
                    .thenReturn(ProfileResponse.builder().id(7L).isOnboarded(true).build());

            final ProfileResponse response = service.submitOnboarding(AUTH_USER_ID, request);

            assertThat(response.isOnboarded()).isTrue();
            assertThat(profile.isOnboarded()).isTrue();

            // Previous answers are cleared first, then the new batch is saved
            verify(onboardingAnswerRepository).deleteByUserProfileId(7L);

            final ArgumentCaptor<List<OnboardingAnswer>> captor = ArgumentCaptor.forClass(List.class);
            verify(onboardingAnswerRepository).saveAll(captor.capture());
            assertThat(captor.getValue()).hasSize(2);
            assertThat(captor.getValue().get(0).getQuestionKey()).isEqualTo("values_adventure");
            assertThat(captor.getValue().get(0).getUserProfileId()).isEqualTo(7L);
            assertThat(captor.getValue().get(0).getWeight()).isEqualTo(3);
        }

        @Test
        @DisplayName("Should throw when the profile does not exist")
        void shouldThrowWhenProfileMissing() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.empty());

            final OnboardingSubmitRequest request = OnboardingSubmitRequest.builder()
                    .answers(List.of(OnboardingAnswerRequest.builder()
                            .questionKey("values_adventure")
                            .answerValue("5")
                            .weight(3)
                            .build()))
                    .build();

            assertThatThrownBy(() -> service.submitOnboarding(AUTH_USER_ID, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Profile not found");

            verify(onboardingAnswerRepository, never()).saveAll(anyList());
            verify(userProfileRepository, never()).save(any(UserProfile.class));
        }
    }
}
