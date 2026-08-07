package com.neighbornest.notificationservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.notificationservice.config.SecurityConfig;
import com.neighbornest.notificationservice.dto.request.CreateTemplateRequest;
import com.neighbornest.notificationservice.dto.request.SendNotificationRequest;
import com.neighbornest.notificationservice.dto.request.UpdatePreferenceRequest;
import com.neighbornest.notificationservice.dto.response.EmailTemplateResponse;
import com.neighbornest.notificationservice.dto.response.NotificationCountResponse;
import com.neighbornest.notificationservice.dto.response.NotificationPreferenceResponse;
import com.neighbornest.notificationservice.dto.response.NotificationResponse;
import com.neighbornest.notificationservice.dto.response.NotificationStatsResponse;
import com.neighbornest.notificationservice.enums.NotificationChannel;
import com.neighbornest.notificationservice.enums.NotificationStatus;
import com.neighbornest.notificationservice.enums.NotificationType;
import com.neighbornest.notificationservice.security.JwtService;
import com.neighbornest.notificationservice.service.NotificationService;
import com.neighbornest.notificationservice.util.UserContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
 * Web-layer tests for {@link NotificationController}.
 * <p>
 * Uses {@link WebMvcTest} with mocked services. The real {@link SecurityConfig}
 * is imported and {@link JwtService} is mocked so the JWT filter authenticates
 * every request; the role claim is stubbed to {@code ADMIN} so the
 * {@code @PreAuthorize} admin endpoints can be exercised (a dedicated test
 * re-stubs it to {@code NEWCOMER} and expects 403).
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@WebMvcTest(NotificationController.class)
@Import(SecurityConfig.class)
@DisplayName("NotificationController Web Tests")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    private UserContext userContext;

    @MockitoBean
    private JwtService jwtService;

    private static final Long AUTH_USER_ID = 42L;
    private static final Long PROFILE_ID = 7L;

    @BeforeEach
    void setUp() {
        when(jwtService.isValid(anyString())).thenReturn(true);
        when(jwtService.extractUserId(anyString())).thenReturn(AUTH_USER_ID);
        when(jwtService.extractRole(anyString())).thenReturn("ADMIN");
        when(userContext.requireProfileId()).thenReturn(PROFILE_ID);
    }

    private static String authHeader() {
        return "Bearer test-token";
    }

    private NotificationResponse notificationResponse() {
        return NotificationResponse.builder()
                .id(1L)
                .userId(PROFILE_ID)
                .type(NotificationType.NEST_CREATED)
                .title("Welcome!")
                .message("You've been added to a Nest.")
                .channel(NotificationChannel.EMAIL)
                .status(NotificationStatus.SENT)
                .relatedEntityType("NEST")
                .relatedEntityId(3L)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private NotificationCountResponse counts() {
        return NotificationCountResponse.builder().total(10).unread(4).read(6).build();
    }

    private NotificationPreferenceResponse preferences() {
        return NotificationPreferenceResponse.builder()
                .userId(PROFILE_ID)
                .emailEnabled(true)
                .smsEnabled(false)
                .pushEnabled(true)
                .meetingReminders(true)
                .expenseAlerts(true)
                .vibeCheckReminders(true)
                .chatNotifications(true)
                .build();
    }

    @Nested
    @DisplayName("User inbox endpoints")
    class InboxEndpoints {

        @Test
        @DisplayName("GET /api/notifications/me returns a paginated inbox")
        void shouldReturnInbox() throws Exception {
            when(notificationService.getForUser(eq(PROFILE_ID), any()))
                    .thenReturn(new PageImpl<>(List.of(notificationResponse()), PageRequest.of(0, 20), 1));

            mockMvc.perform(get("/api/notifications/me").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").value(1))
                    .andExpect(jsonPath("$.content[0].user_id").value(PROFILE_ID))
                    .andExpect(jsonPath("$.content[0].related_entity_type").value("NEST"));
        }

        @Test
        @DisplayName("GET /api/notifications/me/unread-count returns counts")
        void shouldReturnUnreadCount() throws Exception {
            when(notificationService.getUnreadCount(PROFILE_ID)).thenReturn(counts());

            mockMvc.perform(get("/api/notifications/me/unread-count").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total").value(10))
                    .andExpect(jsonPath("$.unread").value(4))
                    .andExpect(jsonPath("$.read").value(6));
        }

        @Test
        @DisplayName("PUT /api/notifications/{id}/read marks a notification read")
        void shouldMarkRead() throws Exception {
            when(notificationService.markRead(PROFILE_ID, 1L)).thenReturn(notificationResponse());

            mockMvc.perform(put("/api/notifications/1/read").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.status").value("SENT"));
        }

        @Test
        @DisplayName("PUT /api/notifications/me/read-all marks everything read")
        void shouldMarkAllRead() throws Exception {
            when(notificationService.markAllRead(PROFILE_ID)).thenReturn(counts());

            mockMvc.perform(put("/api/notifications/me/read-all").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.unread").value(4));
        }
    }

    @Nested
    @DisplayName("Preference endpoints")
    class PreferenceEndpoints {

        @Test
        @DisplayName("GET /me/preferences returns the user's preferences")
        void shouldGetPreferences() throws Exception {
            when(notificationService.getPreferences(PROFILE_ID)).thenReturn(preferences());

            mockMvc.perform(get("/api/notifications/me/preferences").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user_id").value(PROFILE_ID))
                    .andExpect(jsonPath("$.email_enabled").value(true))
                    .andExpect(jsonPath("$.sms_enabled").value(false));
        }

        @Test
        @DisplayName("PUT /me/preferences applies a partial update")
        void shouldUpdatePreferences() throws Exception {
            when(notificationService.updatePreferences(eq(PROFILE_ID), any(UpdatePreferenceRequest.class)))
                    .thenReturn(preferences());

            mockMvc.perform(put("/api/notifications/me/preferences")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    UpdatePreferenceRequest.builder().smsEnabled(true).build())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.chat_notifications").value(true));
        }
    }

    @Nested
    @DisplayName("Admin endpoints")
    class AdminEndpoints {

        @Test
        @DisplayName("POST /send dispatches a manual notification for an admin")
        void shouldSendForAdmin() throws Exception {
            final NotificationResponse sent = notificationResponse();
            when(notificationService.sendManual(any(SendNotificationRequest.class))).thenReturn(sent);

            mockMvc.perform(post("/api/notifications/send")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(SendNotificationRequest.builder()
                                    .userId(9L).type(NotificationType.SYSTEM).title("T").message("M")
                                    .channel(NotificationChannel.IN_APP).build())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1));
        }

        @Test
        @DisplayName("POST /send is forbidden for non-admin roles")
        void shouldForbidNonAdminSend() throws Exception {
            when(jwtService.extractRole(anyString())).thenReturn("NEWCOMER");

            mockMvc.perform(post("/api/notifications/send")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(SendNotificationRequest.builder()
                                    .userId(9L).type(NotificationType.SYSTEM).title("T").message("M")
                                    .channel(NotificationChannel.IN_APP).build())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("GET /templates lists email templates")
        void shouldListTemplates() throws Exception {
            when(notificationService.listTemplates()).thenReturn(List.of(EmailTemplateResponse.builder()
                    .id(1L).templateKey("nest-welcome").subject("Welcome!").build()));

            mockMvc.perform(get("/api/notifications/templates").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].template_key").value("nest-welcome"));
        }

        @Test
        @DisplayName("POST /templates creates a template for an admin")
        void shouldCreateTemplateForAdmin() throws Exception {
            when(notificationService.createTemplate(any(CreateTemplateRequest.class)))
                    .thenReturn(EmailTemplateResponse.builder()
                            .id(1L).templateKey("nest-welcome").subject("Welcome!").build());

            mockMvc.perform(post("/api/notifications/templates")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(CreateTemplateRequest.builder()
                                    .templateKey("nest-welcome").subject("Welcome!")
                                    .bodyHtml("<p>Hi</p>").bodyText("Hi").build())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.template_key").value("nest-welcome"));
        }

        @Test
        @DisplayName("POST /templates is forbidden for non-admin roles")
        void shouldForbidNonAdminTemplate() throws Exception {
            when(jwtService.extractRole(anyString())).thenReturn("NEWCOMER");

            mockMvc.perform(post("/api/notifications/templates")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(CreateTemplateRequest.builder()
                                    .templateKey("nest-welcome").subject("Welcome!")
                                    .bodyHtml("<p>Hi</p>").bodyText("Hi").build())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("GET /stats returns aggregated stats for an admin")
        void shouldReturnStatsForAdmin() throws Exception {
            when(notificationService.getStats()).thenReturn(NotificationStatsResponse.builder()
                    .totalSentToday(10)
                    .failedToday(2)
                    .byType(Map.of("NEST_CREATED", 5L))
                    .byChannel(Map.of("EMAIL", 5L))
                    .build());

            mockMvc.perform(get("/api/notifications/stats").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total_sent_today").value(10))
                    .andExpect(jsonPath("$.by_type.NEST_CREATED").value(5));
        }
    }

    @Nested
    @DisplayName("Security")
    class SecurityTests {

        @Test
        @DisplayName("Should reject requests without a bearer token")
        void shouldRejectWithoutToken() throws Exception {
            mockMvc.perform(get("/api/notifications/me"))
                    .andExpect(status().isForbidden());
        }
    }
}
