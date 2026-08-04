package com.neighbornest.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.user.config.SecurityConfig;
import com.neighbornest.user.dto.request.AnchorApplyRequest;
import com.neighbornest.user.dto.request.OnboardingAnswerRequest;
import com.neighbornest.user.dto.request.OnboardingSubmitRequest;
import com.neighbornest.user.dto.request.ProfileCreateRequest;
import com.neighbornest.user.dto.request.ProfileUpdateRequest;
import com.neighbornest.user.dto.response.AnchorApplicationResponse;
import com.neighbornest.user.dto.response.OnboardingStatusResponse;
import com.neighbornest.user.dto.response.ProfileResponse;
import com.neighbornest.user.dto.response.UserMatchResponse;
import com.neighbornest.user.entity.AnchorStatus;
import com.neighbornest.user.entity.UserRole;
import com.neighbornest.user.security.JwtService;
import com.neighbornest.user.service.AnchorApplicationService;
import com.neighbornest.user.service.OnboardingService;
import com.neighbornest.user.service.UserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-layer tests for {@link UserProfileController}.
 * <p>
 * Uses {@link WebMvcTest} with mocked services. The real
 * {@link SecurityConfig} is imported and {@link JwtService} is mocked so the
 * JWT filter authenticates every request as {@code authUserId = 42}.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@WebMvcTest(UserProfileController.class)
@Import(SecurityConfig.class)
@DisplayName("UserProfileController Web Tests")
class UserProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserProfileService userProfileService;

    @MockitoBean
    private OnboardingService onboardingService;

    @MockitoBean
    private AnchorApplicationService anchorApplicationService;

    @MockitoBean
    private JwtService jwtService;

    private static final Long AUTH_USER_ID = 42L;

    @BeforeEach
    void setUp() {
        // Authenticate every request as authUserId 42
        when(jwtService.isValid(anyString())).thenReturn(true);
        when(jwtService.extractUserId(anyString())).thenReturn(AUTH_USER_ID);
    }

    private static String authHeader() {
        return "Bearer test-token";
    }

    private ProfileResponse profileResponse() {
        return ProfileResponse.builder()
                .id(7L)
                .authUserId(AUTH_USER_ID)
                .fullName("John Doe")
                .city("San Francisco")
                .isOnboarded(false)
                .role(UserRole.NEWCOMER)
                .createdAt(LocalDateTime.of(2025, 1, 15, 10, 30))
                .build();
    }

    @Nested
    @DisplayName("POST /api/users/profile")
    class CreateProfileEndpoint {

        @Test
        @DisplayName("Should return 201 with the created profile")
        void shouldReturn201WithCreatedProfile() throws Exception {
            when(userProfileService.createProfile(eq(AUTH_USER_ID), anyString(), any(ProfileCreateRequest.class)))
                    .thenReturn(profileResponse());

            mockMvc.perform(post("/api/users/profile")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    ProfileCreateRequest.builder()
                                            .fullName("John Doe")
                                            .city("San Francisco")
                                            .build())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(7))
                    .andExpect(jsonPath("$.full_name").value("John Doe"))
                    .andExpect(jsonPath("$.auth_user_id").value(AUTH_USER_ID));
        }

        @Test
        @DisplayName("Should return 400 for missing required fields")
        void shouldReturn400ForInvalidPayload() throws Exception {
            mockMvc.perform(post("/api/users/profile")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"fullName\": \"\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 403 when no bearer token is supplied")
        void shouldReturn403WithoutToken() throws Exception {
            // No authentication entry point is configured, so Spring Security's
            // default is a 403 for unauthenticated requests (same as auth-service).
            mockMvc.perform(post("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"fullName\": \"John Doe\", \"city\": \"San Francisco\"}"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/users/me")
    class GetCurrentProfileEndpoint {

        @Test
        @DisplayName("Should return the current user's profile")
        void shouldReturnCurrentProfile() throws Exception {
            when(userProfileService.getCurrentProfile(AUTH_USER_ID)).thenReturn(profileResponse());

            mockMvc.perform(get("/api/users/me").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(7))
                    .andExpect(jsonPath("$.full_name").value("John Doe"));
        }
    }

    @Nested
    @DisplayName("PUT /api/users/me")
    class UpdateProfileEndpoint {

        @Test
        @DisplayName("Should return the updated profile")
        void shouldReturnUpdatedProfile() throws Exception {
            when(userProfileService.updateProfile(eq(AUTH_USER_ID), any(ProfileUpdateRequest.class)))
                    .thenReturn(profileResponse());

            mockMvc.perform(put("/api/users/me")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"occupation\": \"Product Manager\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(7));
        }

        @Test
        @DisplayName("Should return 400 for an invalid field value")
        void shouldReturn400ForInvalidPayload() throws Exception {
            mockMvc.perform(put("/api/users/me")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"yearsInCity\": -5}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/users/onboarding")
    class SubmitOnboardingEndpoint {

        @Test
        @DisplayName("Should submit answers and mark the profile as onboarded")
        void shouldSubmitOnboarding() throws Exception {
            final ProfileResponse onboarded = profileResponse();
            onboarded.setOnboarded(true);
            when(onboardingService.submitOnboarding(eq(AUTH_USER_ID), any(OnboardingSubmitRequest.class)))
                    .thenReturn(onboarded);

            mockMvc.perform(post("/api/users/onboarding")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    OnboardingSubmitRequest.builder()
                                            .answers(List.of(
                                                    OnboardingAnswerRequest.builder()
                                                            .questionKey("values_adventure")
                                                            .answerValue("5")
                                                            .weight(3)
                                                            .build()))
                                            .build())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.is_onboarded").value(true));
        }

        @Test
        @DisplayName("Should return 400 when the answer list is empty")
        void shouldReturn400ForEmptyAnswers() throws Exception {
            mockMvc.perform(post("/api/users/onboarding")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"answers\": []}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/users/onboarding/status")
    class OnboardingStatusEndpoint {

        @Test
        @DisplayName("Should return the onboarding status")
        void shouldReturnStatus() throws Exception {
            when(userProfileService.getOnboardingStatus(AUTH_USER_ID))
                    .thenReturn(OnboardingStatusResponse.builder()
                            .isOnboarded(true)
                            .answerCount(12L)
                            .build());

            mockMvc.perform(get("/api/users/onboarding/status").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    // Lombok's isOnboarded() getter serializes the boolean as
                    // "onboarded" (see frontend types/user.types.ts note).
                    .andExpect(jsonPath("$.onboarded").value(true))
                    .andExpect(jsonPath("$.answerCount").value(12));
        }
    }

    @Nested
    @DisplayName("POST /api/users/anchor-apply")
    class AnchorApplyEndpoint {

        @Test
        @DisplayName("Should return 201 with the submitted application")
        void shouldReturn201WithApplication() throws Exception {
            when(anchorApplicationService.apply(eq(AUTH_USER_ID), any(AnchorApplyRequest.class)))
                    .thenReturn(AnchorApplicationResponse.builder()
                            .id(1L)
                            .userProfileId(7L)
                            .status(AnchorStatus.PENDING)
                            .appliedAt(LocalDateTime.of(2025, 1, 15, 10, 30))
                            .build());

            mockMvc.perform(post("/api/users/anchor-apply")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    AnchorApplyRequest.builder()
                                            .yearsInCity(5)
                                            .neighborhoodsKnown("Mission, Noe Valley")
                                            .experience("Ran a local book club for 3 years")
                                            .build())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.status").value("PENDING"));
        }

        @Test
        @DisplayName("Should return 400 for missing required fields")
        void shouldReturn400ForInvalidPayload() throws Exception {
            mockMvc.perform(post("/api/users/anchor-apply")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"yearsInCity\": 5}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/users/{userId}/profile")
    class PublicProfileEndpoint {

        @Test
        @DisplayName("Should return the public profile view")
        void shouldReturnPublicProfile() throws Exception {
            when(userProfileService.getPublicProfile(7L)).thenReturn(profileResponse());

            mockMvc.perform(get("/api/users/7/profile").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(7))
                    .andExpect(jsonPath("$.full_name").value("John Doe"));
        }
    }

    @Nested
    @DisplayName("GET /api/users/ready-for-match")
    class ReadyForMatchEndpoint {

        @Test
        @DisplayName("Should return the list of match-ready users")
        void shouldReturnMatchReadyUsers() throws Exception {
            when(userProfileService.getReadyForMatch()).thenReturn(List.of(
                    UserMatchResponse.builder().userId(7L).fullName("John Doe").city("San Francisco").build()));

            mockMvc.perform(get("/api/users/ready-for-match").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    // UserMatchResponse has no @JsonProperty on userId/fullName,
                    // so the wire names stay camelCase (matches matching-service's DTO).
                    .andExpect(jsonPath("$[0].userId").value(7))
                    .andExpect(jsonPath("$[0].fullName").value("John Doe"));
        }
    }
}
