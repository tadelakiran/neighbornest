package com.neighbornest.matching.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.matching.client.UserServiceClient;
import com.neighbornest.matching.client.dto.CurrentUserProfileDto;
import com.neighbornest.matching.config.SecurityConfig;
import com.neighbornest.matching.dto.request.ProposalCreateRequest;
import com.neighbornest.matching.dto.response.CompatibilityResponse;
import com.neighbornest.matching.dto.response.MatchProposalResponse;
import com.neighbornest.matching.dto.response.ProposalExecutionResponse;
import com.neighbornest.matching.dto.response.ProposalMemberResponse;
import com.neighbornest.matching.entity.ProposalResponse;
import com.neighbornest.matching.entity.ProposalStatus;
import com.neighbornest.matching.entity.RoleInNest;
import com.neighbornest.matching.security.JwtService;
import com.neighbornest.matching.security.RestAuthenticationEntryPoint;
import com.neighbornest.matching.service.MatchProposalService;
import com.neighbornest.matching.service.MatchingAlgorithmService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-layer tests for {@link MatchingController}.
 * <p>
 * Uses {@link WebMvcTest} with mocked services. The real
 * {@link SecurityConfig} is imported and {@link JwtService} is mocked so the
 * JWT filter authenticates every request as {@code authUserId = 42}.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@WebMvcTest(MatchingController.class)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class})
@DisplayName("MatchingController Web Tests")
class MatchingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private MatchingAlgorithmService matchingAlgorithmService;

    @MockitoBean
    private MatchProposalService matchProposalService;

    @MockitoBean
    private UserServiceClient userServiceClient;

    @MockitoBean
    private JwtService jwtService;

    private static final Long AUTH_USER_ID = 42L;

    @BeforeEach
    void setUp() {
        // Authenticate every request as authUserId 42 and resolve their profile id
        when(jwtService.isValid(anyString())).thenReturn(true);
        when(jwtService.extractUserId(anyString())).thenReturn(AUTH_USER_ID);
        when(userServiceClient.getMyProfile()).thenReturn(CurrentUserProfileDto.builder().id(7L).build());
    }

    private static String authHeader() {
        return "Bearer test-token";
    }

    @Nested
    @DisplayName("POST /api/matching/calculate/{userId}")
    class CalculateEndpoint {

        @Test
        @DisplayName("Should return the number of scores computed")
        void shouldReturnComputedCount() throws Exception {
            when(matchingAlgorithmService.calculateForUser(7L)).thenReturn(5);

            mockMvc.perform(post("/api/matching/calculate/7").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").value(5));
        }
    }

    @Nested
    @DisplayName("GET /api/matching/compatibles/{userId}")
    class CompatiblesEndpoint {

        @Test
        @DisplayName("Should return the top compatible users with scores")
        void shouldReturnCompatibles() throws Exception {
            when(matchingAlgorithmService.getTopCompatibles(7L)).thenReturn(List.of(
                    CompatibilityResponse.builder()
                            .userId(9L)
                            .fullName("Jane Roe")
                            .city("New York")
                            .overallScore(new BigDecimal("90.00"))
                            .build()));

            mockMvc.perform(get("/api/matching/compatibles/7").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].user_id").value(9))
                    .andExpect(jsonPath("$.data[0].full_name").value("Jane Roe"))
                    .andExpect(jsonPath("$.data[0].city").value("New York"))
                    .andExpect(jsonPath("$.data[0].overall_score").value(90.0));
        }
    }

    @Nested
    @DisplayName("POST /api/matching/propose")
    class ProposeEndpoint {

        @Test
        @DisplayName("Should create a proposal and return 201")
        void shouldCreateProposal() throws Exception {
            when(matchProposalService.createProposal(any(ProposalCreateRequest.class)))
                    .thenReturn(MatchProposalResponse.builder()
                            .id(1L)
                            .status(ProposalStatus.PENDING)
                            .proposedAt(LocalDateTime.now())
                            .members(List.of())
                            .build());

            mockMvc.perform(post("/api/matching/propose")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    ProposalCreateRequest.builder()
                                            .userIds(List.of(1L, 2L, 3L, 4L, 5L))
                                            .anchorIds(List.of(1L))
                                            .build())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.status").value("PENDING"));
        }
    }

    @Nested
    @DisplayName("POST /api/matching/proposals/{id}/respond")
    class RespondEndpoint {

        @Test
        @DisplayName("Should record the response for the current user")
        void shouldRecordResponse() throws Exception {
            when(matchProposalService.respond(eq(1L), eq(7L), eq(true)))
                    .thenReturn(MatchProposalResponse.builder()
                            .id(1L)
                            .status(ProposalStatus.ACCEPTED)
                            .members(List.of(
                                    ProposalMemberResponse.builder()
                                            .userId(7L)
                                            .roleInNest(RoleInNest.MEMBER)
                                            .response(ProposalResponse.ACCEPTED)
                                            .build()))
                            .build());

            mockMvc.perform(post("/api/matching/proposals/1/respond")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"accept\": true}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
        }
    }

    @Nested
    @DisplayName("GET /api/matching/proposals/pending/{userId}")
    class PendingProposalsEndpoint {

        @Test
        @DisplayName("Should return pending proposals for a user")
        void shouldReturnPendingProposals() throws Exception {
            when(matchProposalService.getPendingProposals(7L)).thenReturn(List.of(
                    MatchProposalResponse.builder()
                            .id(1L)
                            .status(ProposalStatus.PENDING)
                            .members(List.of())
                            .build()));

            mockMvc.perform(get("/api/matching/proposals/pending/7").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].status").value("PENDING"));
        }
    }

    @Nested
    @DisplayName("POST /api/matching/execute/{proposalId}")
    class ExecuteEndpoint {

        @Test
        @DisplayName("Should execute an accepted proposal and return the Nest ID")
        void shouldExecuteProposal() throws Exception {
            when(matchProposalService.execute(1L))
                    .thenReturn(ProposalExecutionResponse.builder()
                            .proposalId(1L)
                            .nestId(7L)
                            .message("Nest created successfully")
                            .build());

            mockMvc.perform(post("/api/matching/execute/1").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.proposal_id").value(1))
                    .andExpect(jsonPath("$.data.nest_id").value(7))
                    .andExpect(jsonPath("$.data.message").value("Nest created successfully"));
        }
    }
}
