package com.neighbornest.chatservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.chatservice.config.SecurityConfig;
import com.neighbornest.chatservice.config.WebSocketConfig;
import com.neighbornest.chatservice.dto.request.StartConversationRequest;
import com.neighbornest.chatservice.dto.response.ConversationResponse;
import com.neighbornest.chatservice.dto.response.MessageResponse;
import com.neighbornest.chatservice.enums.MessageType;
import com.neighbornest.chatservice.security.JwtChannelInterceptor;
import com.neighbornest.chatservice.security.JwtService;
import com.neighbornest.chatservice.security.RestAuthenticationEntryPoint;
import com.neighbornest.chatservice.service.ChatMessageService;
import com.neighbornest.chatservice.service.ConversationService;
import com.neighbornest.chatservice.service.MarkReadResult;
import com.neighbornest.chatservice.service.ReadReceiptService;
import com.neighbornest.chatservice.util.UserContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

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
 * Web-layer tests for {@link ChatRestController}.
 * <p>
 * Uses {@link WebMvcTest} with mocked services. The real {@link SecurityConfig}
 * is imported and {@link JwtService} is mocked so the JWT filter authenticates
 * every request. WebSocket infrastructure ({@link WebSocketConfig},
 * {@link JwtChannelInterceptor} and the STOMP controller) is excluded from the
 * slice, and {@link UserContext} is mocked to resolve the caller's profile id
 * ({@code 7}).
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@WebMvcTest(
        value = ChatRestController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {WebSocketConfig.class, JwtChannelInterceptor.class, ChatWebSocketController.class}
        )
)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class})
@DisplayName("ChatRestController Web Tests")
class ChatRestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ChatMessageService chatMessageService;

    @MockitoBean
    private ConversationService conversationService;

    @MockitoBean
    private ReadReceiptService readReceiptService;

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
        when(userContext.requireProfileId()).thenReturn(PROFILE_ID);
    }

    private static String authHeader() {
        return "Bearer test-token";
    }

    private MessageResponse messageResponse(final Long id) {
        return MessageResponse.builder()
                .id(id)
                .senderId(PROFILE_ID)
                .senderName("Jane Doe")
                .content("Hello!")
                .messageType(MessageType.TEXT)
                .createdAt(LocalDateTime.now())
                .readByMe(true)
                .build();
    }

    private ConversationResponse conversationResponse() {
        return ConversationResponse.builder()
                .id(5L)
                .participantId(12L)
                .participantName("John Doe")
                .lastMessageContent("See you there!")
                .lastMessageAt(LocalDateTime.now())
                .unreadCount(2)
                .build();
    }

    @Nested
    @DisplayName("GET /api/chat/nests/{nestId}/messages")
    class NestMessagesEndpoint {

        @Test
        @DisplayName("Should return a paginated message history")
        void shouldReturnMessages() throws Exception {
            when(chatMessageService.getNestMessages(eq(1L), eq(PROFILE_ID), any()))
                    .thenReturn(new PageImpl<>(List.of(messageResponse(101L)), PageRequest.of(0, 50), 1));

            mockMvc.perform(get("/api/chat/nests/1/messages").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[0].id").value(101))
                    .andExpect(jsonPath("$.data.content[0].sender_name").value("Jane Doe"))
                    .andExpect(jsonPath("$.data.content[0].is_read_by_me").value(true));
        }

        @Test
        @DisplayName("Should return 401 without a bearer token")
        void shouldReturn401WithoutToken() throws Exception {
            mockMvc.perform(get("/api/chat/nests/1/messages"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/chat/nests/{nestId}/members/online")
    class OnlineMembersEndpoint {

        @Test
        @DisplayName("Should return the active member ids")
        void shouldReturnMemberIds() throws Exception {
            when(chatMessageService.getNestMemberIds(1L, PROFILE_ID)).thenReturn(List.of(7L, 12L));

            mockMvc.perform(get("/api/chat/nests/1/members/online").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0]").value(7))
                    .andExpect(jsonPath("$.data[1]").value(12));
        }
    }

    @Nested
    @DisplayName("POST /api/chat/dm/start")
    class StartConversationEndpoint {

        @Test
        @DisplayName("Should start a conversation and return 201")
        void shouldStartConversation() throws Exception {
            when(conversationService.startConversation(eq(PROFILE_ID), any(StartConversationRequest.class)))
                    .thenReturn(conversationResponse());

            mockMvc.perform(post("/api/chat/dm/start")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    StartConversationRequest.builder().participantId(12L).build())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.id").value(5))
                    .andExpect(jsonPath("$.data.participant_id").value(12))
                    .andExpect(jsonPath("$.data.unread_count").value(2));
        }

        @Test
        @DisplayName("Should return 400 when participantId is missing")
        void shouldReturn400ForMissingParticipant() throws Exception {
            mockMvc.perform(post("/api/chat/dm/start")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/chat/dm/conversations")
    class ConversationsEndpoint {

        @Test
        @DisplayName("Should return the caller's conversations")
        void shouldReturnConversations() throws Exception {
            when(conversationService.getConversations(PROFILE_ID)).thenReturn(List.of(conversationResponse()));

            mockMvc.perform(get("/api/chat/dm/conversations").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].id").value(5))
                    .andExpect(jsonPath("$.data[0].participant_name").value("John Doe"));
        }
    }

    @Nested
    @DisplayName("GET /api/chat/dm/{conversationId}/messages")
    class DirectMessagesEndpoint {

        @Test
        @DisplayName("Should return a paginated direct-message history")
        void shouldReturnMessages() throws Exception {
            when(chatMessageService.getDirectMessages(eq(5L), eq(PROFILE_ID), any()))
                    .thenReturn(new PageImpl<>(List.of(messageResponse(201L)), PageRequest.of(0, 50), 1));

            mockMvc.perform(get("/api/chat/dm/5/messages").header("Authorization", authHeader()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[0].id").value(201))
                    .andExpect(jsonPath("$.data.content[0].message_type").value("TEXT"));
        }
    }

    @Nested
    @DisplayName("POST /api/chat/messages/read")
    class MarkReadEndpoint {

        @Test
        @DisplayName("Should mark messages read and return the count")
        void shouldMarkRead() throws Exception {
            when(readReceiptService.markRead(PROFILE_ID, List.of(101L, 102L)))
                    .thenReturn(new MarkReadResult(2, List.of()));

            mockMvc.perform(post("/api/chat/messages/read")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"messageIds\": [101, 102]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.marked_count").value(2));
        }

        @Test
        @DisplayName("Should return 400 when messageIds is empty")
        void shouldReturn400ForEmptyMessageIds() throws Exception {
            mockMvc.perform(post("/api/chat/messages/read")
                            .header("Authorization", authHeader())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"messageIds\": []}"))
                    .andExpect(status().isBadRequest());
        }
    }
}
