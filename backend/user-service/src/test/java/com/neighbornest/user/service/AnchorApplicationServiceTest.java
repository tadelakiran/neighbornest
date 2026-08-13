package com.neighbornest.user.service;

import com.neighbornest.user.dto.request.AnchorApplyRequest;
import com.neighbornest.user.dto.request.AnchorReviewRequest.ReviewDecision;
import com.neighbornest.user.dto.response.AnchorApplicationResponse;
import com.neighbornest.user.entity.AnchorApplication;
import com.neighbornest.user.entity.AnchorStatus;
import com.neighbornest.user.entity.UserProfile;
import com.neighbornest.user.entity.UserRole;
import com.neighbornest.user.event.AnchorApplicationReviewedEvent;
import com.neighbornest.user.event.UserEventPublisher;
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
import java.util.List;
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

    @Mock
    private UserEventPublisher userEventPublisher;

    private AnchorApplicationService service;

    private static final Long AUTH_USER_ID = 42L;

    @BeforeEach
    void setUp() {
        service = new AnchorApplicationService(
                anchorApplicationRepository, userProfileRepository, userEventPublisher);
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
    @DisplayName("review method")
    class ReviewTests {

        @Test
        @DisplayName("Should approve a pending application and promote the profile to ANCHOR")
        void shouldApproveAndPromote() {
            final AnchorApplication application = AnchorApplication.builder()
                    .id(1L)
                    .userProfileId(7L)
                    .status(AnchorStatus.PENDING)
                    .appliedAt(LocalDateTime.now())
                    .build();
            final UserProfile profile = profile(true);
            profile.setRole(UserRole.NEWCOMER);

            when(anchorApplicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(anchorApplicationRepository.save(application)).thenReturn(application);
            when(userProfileRepository.findById(7L)).thenReturn(Optional.of(profile));

            final AnchorApplicationResponse response = service.review(1L, ReviewDecision.APPROVE, "Great fit");

            assertThat(response.getStatus()).isEqualTo(AnchorStatus.APPROVED);
            assertThat(response.getReviewNote()).isEqualTo("Great fit");
            assertThat(response.getReviewedAt()).isNotNull();
            assertThat(response.getFullName()).isEqualTo("John Doe");
            assertThat(profile.getRole()).isEqualTo(UserRole.ANCHOR);
            verify(userProfileRepository).save(profile);
            // The applicant is notified about the verdict.
            verify(userEventPublisher).publishAnchorApplicationReviewed(any(AnchorApplicationReviewedEvent.class));
        }

        @Test
        @DisplayName("Should reject a pending application without promoting the profile")
        void shouldRejectWithoutPromotion() {
            final AnchorApplication application = AnchorApplication.builder()
                    .id(1L)
                    .userProfileId(7L)
                    .status(AnchorStatus.PENDING)
                    .appliedAt(LocalDateTime.now())
                    .build();

            when(anchorApplicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(anchorApplicationRepository.save(application)).thenReturn(application);
            when(userProfileRepository.findById(7L)).thenReturn(Optional.of(profile(true)));

            final AnchorApplicationResponse response = service.review(1L, ReviewDecision.REJECT, null);

            assertThat(response.getStatus()).isEqualTo(AnchorStatus.REJECTED);
            assertThat(response.getFullName()).isEqualTo("John Doe");
            verify(userProfileRepository, never()).save(any(UserProfile.class));
            // A rejection is also communicated to the applicant.
            verify(userEventPublisher).publishAnchorApplicationReviewed(any(AnchorApplicationReviewedEvent.class));
        }

        @Test
        @DisplayName("Should throw when the application does not exist")
        void shouldThrowWhenApplicationMissing() {
            when(anchorApplicationRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.review(99L, ReviewDecision.APPROVE, null))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Anchor application not found");
        }

        @Test
        @DisplayName("Should throw when the application is not pending")
        void shouldThrowWhenAlreadyReviewed() {
            final AnchorApplication application = AnchorApplication.builder()
                    .id(1L)
                    .userProfileId(7L)
                    .status(AnchorStatus.APPROVED)
                    .appliedAt(LocalDateTime.now())
                    .build();
            when(anchorApplicationRepository.findById(1L)).thenReturn(Optional.of(application));

            assertThatThrownBy(() -> service.review(1L, ReviewDecision.APPROVE, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Only pending applications");
        }
    }

    @Nested
    @DisplayName("listApplications method")
    class ListApplicationsTests {

        @Test
        @DisplayName("Should list all applications with applicant names when no status filter is given")
        void shouldListAll() {
            when(anchorApplicationRepository.findAllByOrderByAppliedAtDesc())
                    .thenReturn(List.of(AnchorApplication.builder().id(1L).userProfileId(7L).status(AnchorStatus.PENDING).build()));
            when(userProfileRepository.findAllById(List.of(7L)))
                    .thenReturn(List.of(profile(true)));

            final var responses = service.listApplications(null);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getId()).isEqualTo(1L);
            assertThat(responses.get(0).getFullName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should filter applications by status")
        void shouldFilterByStatus() {
            when(anchorApplicationRepository.findAllByStatusOrderByAppliedAtDesc(AnchorStatus.PENDING))
                    .thenReturn(List.of(AnchorApplication.builder().id(2L).userProfileId(7L).status(AnchorStatus.PENDING).build()));
            when(userProfileRepository.findAllById(List.of(7L)))
                    .thenReturn(List.of(profile(true)));

            final var responses = service.listApplications(AnchorStatus.PENDING);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getStatus()).isEqualTo(AnchorStatus.PENDING);
            assertThat(responses.get(0).getFullName()).isEqualTo("John Doe");
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
