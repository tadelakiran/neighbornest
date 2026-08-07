package com.neighbornest.nest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.nest.client.UserProfileSummary;
import com.neighbornest.nest.client.UserServiceClient;
import com.neighbornest.nest.config.SecurityConfig;
import com.neighbornest.nest.dto.request.MeetingRequest;
import com.neighbornest.nest.dto.response.ExpenseResponse;
import com.neighbornest.nest.dto.response.MeetingResponse;
import com.neighbornest.nest.dto.response.NestResponse;
import com.neighbornest.nest.dto.response.VibeCheckStatusResponse;
import com.neighbornest.nest.entity.MeetingStatus;
import com.neighbornest.nest.entity.NestStatus;
import com.neighbornest.nest.entity.SplitType;
import com.neighbornest.nest.security.JwtService;
import com.neighbornest.nest.service.ExpenseService;
import com.neighbornest.nest.service.MeetingService;
import com.neighbornest.nest.service.NestService;
import com.neighbornest.nest.service.VibeCheckService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-layer tests for {@link NestController}.
 * <p>
 * Uses {@link WebMvcTest} with mocked services. The real {@link SecurityConfig}
 * is imported and {@link JwtService} is mocked so the JWT filter authenticates
 * every request as {@code authUserId = 42}. The {@link UserServiceClient} is
 * mocked to resolve the caller's profile id ({@code 7}), which every
 * member-scoped endpoint uses.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@WebMvcTest(NestController.class)
@Import(SecurityConfig.class)
@DisplayName("NestController Web Tests")
class NestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private NestService nestService;

    @MockitoBean
    private MeetingService meetingService;

    @MockitoBean
    private ExpenseService expenseService;

    @MockitoBean
    private VibeCheckService vibeCheckService;

    @MockitoBean
    private UserServiceClient userServiceClient;

    @MockitoBean
    private JwtService jwtService;

    private static final Long AUTH_USER_ID = 42L;
    private static final Long PROFILE_ID = 7L;

    @BeforeEach
    void setUp() {
        // Authenticate every request as authUserId 42 and resolve its profile id 7.
        when(jwtService.isValid(anyString())).thenReturn(true);
        when(jwtService.extractUserId(anyString())).thenReturn(AUTH_USER_ID);
        when(userServiceClient.getMyProfile())
                .thenReturn(UserProfileSummary.builder().id(PROFILE_ID).fullName("John Doe").build());
    }

    private static String authHeader() {
        return "Bearer test-token";
    }

    private NestResponse nestResponse() {
        return NestResponse.builder()
                .id(1L)
                .name("Mission Mates")
                .city("San Francisco")
                .status(NestStatus.ACTIVE)
                .members(List.of())
                .build();
    }

    private MeetingResponse meetingResponse() {
        return MeetingResponse.builder()
                .id(1L)
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .venueName("Blue Bottle Coffee")
                .activityType("Coffee & Chat")
                .status(MeetingStatus.SCHEDULED)
                .build();
    }

    private ExpenseResponse expenseResponse() {
        return ExpenseResponse.builder()
                .id(1L)
                .payerId(PROFILE_ID)
                .amount(BigDecimal.valueOf(100.00))
                .description("Group dinner")
                .splitType(SplitType.EQUAL)
                .splits(List.of())
                .build();
    }

    @Nested
    @DisplayName("POST /api/nests/{nestId}/leave")
    class LeaveEndpoint {

        @Test
        @DisplayName("Should leave the nest and return the updated nest")
        void shouldLeaveNest() throws Exception {
            when(nestService.leave(eq(1L), eq(PROFILE_ID))).thenReturn(nestResponse());

            mockMvc.perform(post("/api/nests/1/leave").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.status").value("ACTIVE"));

            verify(nestService).leave(1L, PROFILE_ID);
        }

        @Test
        @DisplayName("Should return 403 without a bearer token")
        void shouldReturn403WithoutToken() throws Exception {
            mockMvc.perform(post("/api/nests/1/leave"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("DELETE /api/nests/{nestId}/members/{userId}")
    class RemoveMemberEndpoint {

        @Test
        @DisplayName("Should remove a member as an anchor")
        void shouldRemoveMember() throws Exception {
            when(nestService.removeMember(eq(1L), eq(PROFILE_ID), eq(8L))).thenReturn(nestResponse());

            mockMvc.perform(delete("/api/nests/1/members/8").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1));

            verify(nestService).removeMember(1L, PROFILE_ID, 8L);
        }
    }

    @Nested
    @DisplayName("PATCH /api/nests/{nestId}/expenses/{expenseId}/settle")
    class SettleExpenseEndpoint {

        @Test
        @DisplayName("Should settle the caller's split")
        void shouldSettleSplit() throws Exception {
            when(expenseService.settleSplit(eq(1L), eq(10L), eq(PROFILE_ID))).thenReturn(expenseResponse());

            mockMvc.perform(patch("/api/nests/1/expenses/10/settle").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.split_type").value("EQUAL"));

            verify(expenseService).settleSplit(1L, 10L, PROFILE_ID);
        }
    }

    @Nested
    @DisplayName("POST /api/nests/{nestId}/meetings/{meetingId}/complete|cancel")
    class MeetingLifecycleEndpoints {

        @Test
        @DisplayName("Should complete a meeting")
        void shouldCompleteMeeting() throws Exception {
            final MeetingResponse completed = meetingResponse();
            completed.setStatus(MeetingStatus.COMPLETED);
            when(meetingService.completeMeeting(eq(1L), eq(5L), eq(PROFILE_ID))).thenReturn(completed);

            mockMvc.perform(post("/api/nests/1/meetings/5/complete").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("COMPLETED"));
        }

        @Test
        @DisplayName("Should cancel a meeting")
        void shouldCancelMeeting() throws Exception {
            final MeetingResponse cancelled = meetingResponse();
            cancelled.setStatus(MeetingStatus.CANCELLED);
            when(meetingService.cancelMeeting(eq(1L), eq(5L), eq(PROFILE_ID))).thenReturn(cancelled);

            mockMvc.perform(post("/api/nests/1/meetings/5/cancel").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CANCELLED"));
        }
    }

    @Nested
    @DisplayName("POST /api/nests/{nestId}/meetings")
    class ScheduleMeetingEndpoint {

        @Test
        @DisplayName("Should schedule a meeting with the resolved profile id")
        void shouldScheduleMeeting() throws Exception {
            when(meetingService.scheduleMeeting(eq(1L), eq(PROFILE_ID), any(MeetingRequest.class)))
                    .thenReturn(meetingResponse());

            mockMvc.perform(post("/api/nests/1/meetings")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    MeetingRequest.builder()
                                            .scheduledAt(LocalDateTime.now().plusDays(1))
                                            .venueName("Blue Bottle Coffee")
                                            .activityType("Coffee & Chat")
                                            .build())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1));
        }

        @Test
        @DisplayName("Should return 400 when the caller has no profile")
        void shouldReturn400WithoutProfile() throws Exception {
            when(userServiceClient.getMyProfile()).thenReturn(null);

            mockMvc.perform(post("/api/nests/1/meetings")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    MeetingRequest.builder()
                                            .scheduledAt(LocalDateTime.now().plusDays(1))
                                            .venueName("Blue Bottle Coffee")
                                            .activityType("Coffee & Chat")
                                            .build())))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET member-scoped list endpoints")
    class MemberScopedListEndpoints {

        @Test
        @DisplayName("Should list meetings for a member")
        void shouldListMeetings() throws Exception {
            when(meetingService.listMeetings(eq(1L), eq(PROFILE_ID))).thenReturn(List.of(meetingResponse()));

            mockMvc.perform(get("/api/nests/1/meetings").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(1));
        }

        @Test
        @DisplayName("Should list expenses for a member")
        void shouldListExpenses() throws Exception {
            when(expenseService.listExpenses(eq(1L), eq(PROFILE_ID))).thenReturn(List.of(expenseResponse()));

            mockMvc.perform(get("/api/nests/1/expenses").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(1));
        }

        @Test
        @DisplayName("Should return the vibe check status for a member")
        void shouldGetVibeCheckStatus() throws Exception {
            when(vibeCheckService.getStatus(eq(1L), eq(PROFILE_ID)))
                    .thenReturn(VibeCheckStatusResponse.builder()
                            .averageConnection(BigDecimal.valueOf(7.50))
                            .averageComfort(BigDecimal.valueOf(8.00))
                            .overallAverage(BigDecimal.valueOf(7.75))
                            .submissionCount(2)
                            .submissions(List.of())
                            .build());

            mockMvc.perform(get("/api/nests/1/vibe-check/status").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.submissionCount").value(2));
        }
    }
}
