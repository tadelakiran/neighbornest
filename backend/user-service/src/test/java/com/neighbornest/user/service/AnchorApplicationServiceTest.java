package com.neighbornest.user.service;

import com.neighbornest.user.dto.request.AnchorApplyRequest;
import com.neighbornest.user.dto.response.AnchorApplicationResponse;
import com.neighbornest.user.entity.AnchorApplication;
import com.neighbornest.user.entity.AnchorStatus;
import com.neighbornest.user.entity.UserProfile;
import com.neighbornest.user.exception.BadRequestException;
import com.neighbornest.user.exception.ResourceNotFoundException;
import com.neighbornest.user.repository.AnchorApplicationRepository;
import com.neighbornest.user.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AnchorApplicationService}.
 * <p>
 * Plain Mockito tests — repositories are mocked so the anchor application
 * workflow is exercised in isolation.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AnchorApplicationService Unit Tests")
class AnchorApplicationServiceTest {

    @Mock
    private AnchorApplicationRepository anchorApplicationRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private AnchorApplicationService service;

    private static final Long AUTH_USER_ID = 42L;

    @BeforeEach
    void setUp() {
        service = new AnchorApplicationService(anchorApplicationRepository, userProfileRepository);
    }

    /**
     * Builds a profile with the given onboarding state.
     */
    private UserProfile profile(final boolean onboarded) {
        return UserProfile.builder()
                .id(7L)
                .authUserId(AUTH_USER_ID)
                .fullName("John Doe")
                .isOnboarded(onboarded)
                .build();
    }

    /**
     * Builds a valid anchor application request.
     */
    private AnchorApplyRequest request() {
        return AnchorApplyRequest.builder()
                .yearsInCity(5)
                .neighborhoodsKnown("Mission, Noe Valley")
                .languagesSpoken("English, Spanish")
                .experience("Ran a local book club for 3 years")
                .availability("Evenings and weekends")
                .build();
    }

    @Nested
    @DisplayName("apply method")
    class ApplyTests {

        @Test
        @DisplayName("Should create a PENDING application for an onboarded user")
        void shouldCreateApplication() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID))
                    .thenReturn(Optional.of(profile(true)));

            final AnchorApplication saved = AnchorApplication.builder()
                    .id(1L)
                    .userProfileId(7L)
                    .yearsInCity(5)
                    .status(AnchorStatus.PENDING)
                    .appliedAt(LocalDateTime.now())
                    .build();
            when(anchorApplicationRepository.save(any(AnchorApplication.class))).thenReturn(saved);

            final AnchorApplicationResponse response = service.apply(AUTH_USER_ID, request());

            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getStatus()).isEqualTo(AnchorStatus.PENDING);
            assertThat(response.getUserProfileId()).isEqualTo(7L);

            final ArgumentCaptor<AnchorApplication> captor = ArgumentCaptor.forClass(AnchorApplication.class);
            verify(anchorApplicationRepository).save(captor.capture());
            assertThat(captor.getValue().getNeighborhoodsKnown()).isEqualTo("Mission, Noe Valley");
            assertThat(captor.getValue().getYearsInCity()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should throw when the profile does not exist")
        void shouldThrowWhenProfileMissing() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.apply(AUTH_USER_ID, request()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Profile not found");

            verify(anchorApplicationRepository, never()).save(any(AnchorApplication.class));
        }

        @Test
        @DisplayName("Should throw when onboarding is not complete")
        void shouldThrowWhenNotOnboarded() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID))
                    .thenReturn(Optional.of(profile(false)));

            assertThatThrownBy(() -> service.apply(AUTH_USER_ID, request()))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Complete onboarding");

            verify(anchorApplicationRepository, never()).save(any(AnchorApplication.class));
        }
    }

    @Nested
    @DisplayName("getMyApplication method")
    class GetMyApplicationTests {

        @Test
        @DisplayName("Should return the most recent application")
        void shouldReturnMostRecentApplication() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID))
                    .thenReturn(Optional.of(profile(true)));

            final AnchorApplication application = AnchorApplication.builder()
                    .id(1L)
                    .userProfileId(7L)
                    .yearsInCity(5)
                    .status(AnchorStatus.APPROVED)
                    .appliedAt(LocalDateTime.now())
                    .build();
            when(anchorApplicationRepository.findTopByUserProfileIdOrderByAppliedAtDesc(7L))
                    .thenReturn(Optional.of(application));

            final AnchorApplicationResponse response = service.getMyApplication(AUTH_USER_ID);

            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getStatus()).isEqualTo(AnchorStatus.APPROVED);
        }

        @Test
        @DisplayName("Should throw when no application exists")
        void shouldThrowWhenNoApplication() {
            when(userProfileRepository.findByAuthUserId(AUTH_USER_ID))
                    .thenReturn(Optional.of(profile(true)));
            when(anchorApplicationRepository.findTopByUserProfileIdOrderByAppliedAtDesc(7L))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getMyApplication(AUTH_USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("No anchor application found");
        }
    }
}
