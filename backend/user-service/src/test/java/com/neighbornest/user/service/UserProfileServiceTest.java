package com.neighbornest.user.service;

import com.neighbornest.user.client.AuthServiceClient;
import com.neighbornest.user.dto.request.ProfileCreateRequest;
import com.neighbornest.user.dto.request.ProfileUpdateRequest;
import com.neighbornest.user.dto.response.AuthValidationResponse;
import com.neighbornest.user.dto.response.OnboardingStatusResponse;
import com.neighbornest.user.dto.response.ProfileResponse;
import com.neighbornest.user.dto.response.UserMatchResponse;
import com.neighbornest.user.entity.BudgetLevel;
import com.neighbornest.user.entity.OnboardingAnswer;
import com.neighbornest.user.entity.SocialGoal;
import com.neighbornest.user.entity.UserProfile;
import com.neighbornest.user.entity.UserRole;
import com.neighbornest.user.entity.WorkType;
import com.neighbornest.user.exception.BadRequestException;
import com.neighbornest.user.exception.DuplicateProfileException;
import com.neighbornest.user.exception.ResourceNotFoundException;
import com.neighbornest.user.repository.AnchorApplicationRepository;
import com.neighbornest.user.repository.OnboardingAnswerRepository;
import com.neighbornest.user.repository.UserProfileRepository;
import com.neighbornest.user.util.UserProfileMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link UserProfileService}.
 * <p>
 * Plain Mockito tests — the repository, Feign client and mapper are mocked so
 * the service logic is exercised in isolation.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserProfileService Unit Tests")
class UserProfileServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private OnboardingAnswerRepository onboardingAnswerRepository;

    @Mock
    private AnchorApplicationRepository anchorApplicationRepository;

    @Mock
    private AuthServiceClient authServiceClient;

    @Mock
    private UserProfileMapper userProfileMapper;

    @Mock
    private PhotoStorageService photoStorageService;

    private UserProfileService service;

    private static final Long AUTH_USER_ID = 42L;

    @BeforeEach
    void setUp() {
        service = new UserProfileService(
                userProfileRepository, onboardingAnswerRepository, anchorApplicationRepository,
                authServiceClient, userProfileMapper, photoStorageService);
    }

    /**
     * Builds a profile entity with the given auth user ID.
     */
    private UserProfile profile(final Long authUserId) {
        return UserProfile.builder()
                .id(7L)
                .authUserId(authUserId)
                .fullName("John Doe")
                .city("San Francisco")
                .workType(WorkType.FULL_TIME)
                .socialGoal(SocialGoal.FRIENDSHIP)
                .budgetLevel(BudgetLevel.MEDIUM)
                .isOnboarded(false)
                .role(UserRole.NEWCOMER)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("createProfile method")
    class CreateProfileTests {

        @Test
        @DisplayName("Should create a profile for the authenticated user")
        void shouldCreateProfile() {
            final UserProfile profile = profile(AUTH_USER_ID);
            when(userProfileRepository.existsByAuthUserId(AUTH_USER_ID)).thenReturn(false);
            when(authServiceClient.validateToken("valid-token"))
                    .thenReturn(ResponseEntity.ok(AuthValidationResponse.builder()
                            .valid(true).userId(AUTH_USER_ID).build()));
            when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);
            when(userProfileMapper.toProfileResponse(any(UserProfile.class), anyList()))
                    .thenReturn(ProfileResponse.builder().id(7L).authUserId(AUTH_USER_ID).build());

            final ProfileCreateRequest request = ProfileCreateRequest.builder()
                    .fullName("  John Doe  ")
                    .city(" San Francisco ")
                    .build();

            final ProfileResponse response = service.createProfile(AUTH_USER_ID, "Bearer valid-token", request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(7L);
            assertThat(response.getAuthUserId()).isEqualTo(AUTH_USER_ID);
            verify(userProfileRepository).save(any(UserProfile.class));
        }

        @Test
        @DisplayName("Should throw when a profile already exists")
        void shouldThrowWhenProfileExists() {
            when(userProfileRepository.existsByAuthUserId(AUTH_USER_ID)).thenReturn(true);

            final ProfileCreateRequest request = ProfileCreateRequest.builder()
                    .fullName("John Doe")
                    .city("San Francisco")
                    .build();

            assertThatThrownBy(() -> service.createProfile(AUTH_USER_ID, "Bearer valid-token", request))
                    .isInstanceOf(DuplicateProfileException.class)
                    .hasMessageContaining("already exists");

            verify(userProfileRepository, never()).save(any(UserProfile.class));
        }

        @Test
        @DisplayName("Should throw when no Authorization token is provided")
        void shouldThrowWhenTokenMissing() {
            when(userProfileRepository.existsByAuthUserId(AUTH_USER_ID)).thenReturn(false);

            final ProfileCreateRequest request = ProfileCreateRequest.builder()
                    .fullName("John Doe")
                    .city("San Francisco")
                    .build();

            assertThatThrownBy(() -> service.createProfile(AUTH_USER_ID, null, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Authorization token is required");
        }

        @Test
        @DisplayName("Should throw when the token belongs to a different user")
        void shouldThrowWhenTokenBelongsToAnotherUser() {
            when(userProfileRepository.existsByAuthUserId(AUTH_USER_ID)).thenReturn(false);
            when(authServiceClient.validateToken("valid-token"))
                    .thenReturn(ResponseEntity.ok(AuthValidationResponse.builder()
                            .valid(true).userId(999L).build()));

            final ProfileCreateRequest request = ProfileCreateRequest.builder()
                    .fullName("John Doe")
                    .city("San Francisco")
                    .build();

            assertThatThrownBy(() -> service.createProfile(AUTH_USER_ID, "Bearer valid-token", request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("does not belong");
        }

        @Test
        @DisplayName("Should continue when the auth-service cannot confirm ownership")
        void shouldContinueWhenAuthServiceUnavailable() {
            final UserProfile profile = profile(AUTH_USER_ID);
            when(userProfileRepository.existsByAuthUserId(AUTH_USER_ID)).thenReturn(false);
            when(authServiceClient.validateToken("valid-token"))
                    .thenReturn(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(null));
            when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);
            when(userProfileMapper.toProfileResponse(any(UserProfile.class), anyList()))
                    .thenReturn(ProfileResponse.builder().id(7L).build());

            final ProfileCreateRequest request = ProfileCreateRequest.builder()
                    .fullName("John Doe")
                    .city("San Francisco")
                    .build();

            final ProfileResponse response = service.createProfile(AUTH_USER_ID, "Bearer valid-token", request);

            // The locally-validated JWT still authorizes the request
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(7L);
        }
    }

    @Nested
    @DisplayName("getCurrentProfile method")
    class GetCurrentProfileTests {

        @Test
        @DisplayName("Should return the profile with onboarding answers")
        void shouldReturnProfileWithAnswers() {
            final UserProfile profile = profile(AUTH_USER_ID);
            final List<OnboardingAnswer> answers = List.of(
                    OnboardingAnswer.builder().questionKey("values_adventure").answerValue("5").build());

            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile));
            when(onboardingAnswerRepository.findByUserProfileIdOrderByQuestionKeyAsc(7L)).thenReturn(answers);
            when(userProfileMapper.toProfileResponse(profile, answers))
                    .thenReturn(ProfileResponse.builder().id(7L).fullName("John Doe").build());

            final ProfileResponse response = service.getCurrentProfile(AUTH_USER_ID);

            assertThat(response).isNotNull();
            assertThat(response.getFullName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should throw when the profile does not exist")
        void shouldThrowWhenProfileMissing() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getCurrentProfile(AUTH_USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Profile not found");
        }
    }

    @Nested
    @DisplayName("updateProfile method")
    class UpdateProfileTests {

        @Test
        @DisplayName("Should apply partial updates and return the updated profile")
        void shouldApplyPartialUpdates() {
            final UserProfile profile = profile(AUTH_USER_ID);
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile));
            when(userProfileRepository.save(profile)).thenReturn(profile);
            when(userProfileMapper.toProfileResponse(any(UserProfile.class), anyList()))
                    .thenReturn(ProfileResponse.builder().id(7L).occupation("Product Manager").build());

            final ProfileUpdateRequest request = ProfileUpdateRequest.builder()
                    .occupation("Product Manager")
                    .workType(WorkType.PART_TIME)
                    .build();

            final ProfileResponse response = service.updateProfile(AUTH_USER_ID, request);

            assertThat(response.getOccupation()).isEqualTo("Product Manager");
            assertThat(profile.getWorkType()).isEqualTo(WorkType.PART_TIME);
            // Untouched fields must survive the update
            assertThat(profile.getFullName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should throw when the profile does not exist")
        void shouldThrowWhenProfileMissing() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.empty());

            final ProfileUpdateRequest request = ProfileUpdateRequest.builder().occupation("Engineer").build();

            assertThatThrownBy(() -> service.updateProfile(AUTH_USER_ID, request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deleteProfile method")
    class DeleteProfileTests {

        @Test
        @DisplayName("Should delete answers, anchor applications and the profile")
        void shouldDeleteProfileAndDependentData() {
            final UserProfile profile = profile(AUTH_USER_ID);
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile));

            service.deleteProfile(AUTH_USER_ID);

            verify(onboardingAnswerRepository).deleteByUserProfileId(7L);
            verify(anchorApplicationRepository).deleteByUserProfileId(7L);
            verify(userProfileRepository).delete(profile);
        }

        @Test
        @DisplayName("Should delete a stored photo when the profile had one")
        void shouldDeleteStoredPhoto() {
            final UserProfile profile = profile(AUTH_USER_ID);
            profile.setProfilePhotoUrl("/api/users/photo/abc123.jpg");
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile));

            service.deleteProfile(AUTH_USER_ID);

            verify(photoStorageService).delete("abc123.jpg");
        }

        @Test
        @DisplayName("Should not touch external photo URLs on delete")
        void shouldIgnoreExternalPhotoUrl() {
            final UserProfile profile = profile(AUTH_USER_ID);
            profile.setProfilePhotoUrl("https://storage.example.com/photos/user1.jpg");
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile));

            service.deleteProfile(AUTH_USER_ID);

            verify(photoStorageService, never()).delete(anyString());
        }

        @Test
        @DisplayName("Should throw when the profile does not exist")
        void shouldThrowWhenProfileMissing() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteProfile(AUTH_USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(userProfileRepository, never()).delete(any(UserProfile.class));
        }
    }

    @Nested
    @DisplayName("uploadProfilePhoto method")
    class UploadProfilePhotoTests {

        @Test
        @DisplayName("Should store the photo and update the profile photo URL")
        void shouldStorePhotoAndUpdateUrl() {
            final UserProfile profile = profile(AUTH_USER_ID);
            final MultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile));
            when(photoStorageService.store(file)).thenReturn("abc123.jpg");
            when(userProfileRepository.save(profile)).thenReturn(profile);
            when(onboardingAnswerRepository.findByUserProfileIdOrderByQuestionKeyAsc(7L)).thenReturn(List.of());
            when(userProfileMapper.toProfileResponse(any(UserProfile.class), anyList()))
                    .thenReturn(ProfileResponse.builder().id(7L).profilePhotoUrl("/api/users/photo/abc123.jpg").build());

            final ProfileResponse response = service.uploadProfilePhoto(AUTH_USER_ID, file);

            assertThat(response.getProfilePhotoUrl()).isEqualTo("/api/users/photo/abc123.jpg");
            assertThat(profile.getProfilePhotoUrl()).isEqualTo("/api/users/photo/abc123.jpg");
            verify(photoStorageService).store(file);
        }

        @Test
        @DisplayName("Should delete the previous stored photo when replacing one")
        void shouldDeletePreviousPhotoOnReplacement() {
            final UserProfile profile = profile(AUTH_USER_ID);
            profile.setProfilePhotoUrl("/api/users/photo/old.jpg");
            final MultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1});

            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile));
            when(photoStorageService.store(file)).thenReturn("new.jpg");
            when(userProfileRepository.save(profile)).thenReturn(profile);
            when(onboardingAnswerRepository.findByUserProfileIdOrderByQuestionKeyAsc(7L)).thenReturn(List.of());
            when(userProfileMapper.toProfileResponse(any(UserProfile.class), anyList()))
                    .thenReturn(ProfileResponse.builder().id(7L).build());

            service.uploadProfilePhoto(AUTH_USER_ID, file);

            verify(photoStorageService).delete("old.jpg");
            assertThat(profile.getProfilePhotoUrl()).isEqualTo("/api/users/photo/new.jpg");
        }

        @Test
        @DisplayName("Should throw when the profile does not exist")
        void shouldThrowWhenProfileMissing() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.uploadProfilePhoto(
                    AUTH_USER_ID, new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1})))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(photoStorageService, never()).store(any());
        }
    }

    @Nested
    @DisplayName("getPublicProfile method")
    class GetPublicProfileTests {

        @Test
        @DisplayName("Should return a profile by profile ID")
        void shouldReturnPublicProfile() {
            final UserProfile profile = profile(AUTH_USER_ID);
            when(userProfileRepository.findById(7L)).thenReturn(Optional.of(profile));
            when(onboardingAnswerRepository.findByUserProfileIdOrderByQuestionKeyAsc(7L)).thenReturn(List.of());
            when(userProfileMapper.toProfileResponse(any(UserProfile.class), anyList()))
                    .thenReturn(ProfileResponse.builder().id(7L).build());

            final ProfileResponse response = service.getPublicProfile(7L);

            assertThat(response.getId()).isEqualTo(7L);
        }

        @Test
        @DisplayName("Should throw when the profile does not exist")
        void shouldThrowWhenProfileMissing() {
            when(userProfileRepository.findById(7L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getPublicProfile(7L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Profile not found with id");
        }
    }

    @Nested
    @DisplayName("getOnboardingStatus method")
    class GetOnboardingStatusTests {

        @Test
        @DisplayName("Should report onboarding completion and answer count")
        void shouldReturnOnboardingStatus() {
            final UserProfile profile = profile(AUTH_USER_ID);
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile));
            when(onboardingAnswerRepository.countByUserProfileId(7L)).thenReturn(12L);

            final OnboardingStatusResponse response = service.getOnboardingStatus(AUTH_USER_ID);

            assertThat(response.isOnboarded()).isFalse();
            assertThat(response.getAnswerCount()).isEqualTo(12L);
        }
    }

    @Nested
    @DisplayName("getReadyForMatch method")
    class GetReadyForMatchTests {

        @Test
        @DisplayName("Should return match-ready profiles with answers, without N+1 queries")
        void shouldReturnMatchReadyProfiles() {
            final UserProfile first = UserProfile.builder()
                    .id(1L)
                    .authUserId(1L)
                    .fullName("John Doe")
                    .city("San Francisco")
                    .isOnboarded(true)
                    .build();
            final UserProfile second = UserProfile.builder()
                    .id(2L)
                    .authUserId(2L)
                    .fullName("Jane Roe")
                    .city("New York")
                    .isOnboarded(true)
                    .build();

            final List<OnboardingAnswer> answers = List.of(
                    OnboardingAnswer.builder().userProfileId(1L).questionKey("values_adventure").answerValue("5").build());

            when(userProfileRepository.findAllReadyForMatch()).thenReturn(List.of(first, second));
            when(onboardingAnswerRepository.findAllByUserProfileIdIn(List.of(1L, 2L))).thenReturn(answers);
            when(userProfileMapper.toMatchResponse(any(UserProfile.class), anyList()))
                    .thenReturn(UserMatchResponse.builder().userId(1L).build());

            final List<UserMatchResponse> responses = service.getReadyForMatch();

            assertThat(responses).hasSize(2);
            verify(onboardingAnswerRepository).findAllByUserProfileIdIn(List.of(1L, 2L));
        }

        @Test
        @DisplayName("Should return an empty list when no profiles are eligible")
        void shouldReturnEmptyListWhenNoEligibleProfiles() {
            when(userProfileRepository.findAllReadyForMatch()).thenReturn(List.of());

            final List<UserMatchResponse> responses = service.getReadyForMatch();

            assertThat(responses).isEmpty();
        }
    }
}
