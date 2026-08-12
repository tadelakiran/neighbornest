package com.neighbornest.chatservice.controller;

import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.dto.request.ChatMessagePayload;
import com.neighbornest.chatservice.dto.request.MarkReadRequest;
import com.neighbornest.chatservice.dto.request.TypingEventPayload;
import com.neighbornest.chatservice.dto.response.MessageResponse;
import com.neighbornest.chatservice.dto.response.ReadReceiptUpdateResponse;
import com.neighbornest.chatservice.dto.response.TypingEventResponse;
import com.neighbornest.chatservice.enums.RoomType;
import com.neighbornest.chatservice.exception.ForbiddenException;
import com.neighbornest.chatservice.exception.UnauthorizedException;
import com.neighbornest.chatservice.security.AuthenticatedUser;
import com.neighbornest.chatservice.service.ChatMessageService;
import com.neighbornest.chatservice.service.ConversationService;
import com.neighbornest.chatservice.service.MarkReadResult;
import com.neighbornest.chatservice.service.ReadReceiptService;
import com.neighbornest.chatservice.service.RoomRead;
import com.neighbornest.chatservice.service.RoomRef;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;

/**
 * STOMP message-mapping controller.
 * <p>
 * Clients {@code SEND} to {@code /app/chat/...} destinations; the server
 * persists the message and broadcasts to the corresponding
 * {@code /topic/...} (group) or {@code /queue/user/...} (private) destinations.
 * The authenticated principal (set by the JWT channel interceptor at CONNECT)
 * is the authoritative sender id — payload sender ids are never trusted.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatMessageService chatMessageService;
    private final ConversationService conversationService;
    private final ReadReceiptService readReceiptService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Sends a group message to a Nest and broadcasts it to
     * {@code /topic/nest.{nestId}.messages} (dot-separated because RabbitMQ's
     * STOMP plugin rejects slashes in topic routing keys).
     *
     * @param nestId  the nest id (from the destination)
     * @param payload the message payload
     * @param accessor the STOMP header accessor (session identity)
     * @return the enriched message, broadcast by {@code @SendTo}
     */
    @MessageMapping("/chat/nest/{nestId}/send")
    @SendTo("/topic/nest.{nestId}.messages")
    public MessageResponse sendNestMessage(@DestinationVariable final Long nestId,
                                           final ChatMessagePayload payload,
                                           final StompHeaderAccessor accessor) {
        final Long senderId = currentUserId(accessor);
        log.debug("WS send nest message from profile {} to nest {}", senderId, nestId);
        return chatMessageService.sendNestMessage(nestId, senderId, payload, sessionToken(accessor));
    }

    /**
     * Sends a direct message and delivers it to both participants' private
     * queues ({@code /queue/user/{id}/dm}), so each side sees the message
     * through its own queue subscription.
     *
     * @param conversationId the conversation id (from the destination)
     * @param payload        the message payload
     * @param accessor       the STOMP header accessor (session identity)
     */
    @MessageMapping("/chat/dm/{conversationId}/send")
    public void sendDirectMessage(@DestinationVariable final Long conversationId,
                                  final ChatMessagePayload payload,
                                  final StompHeaderAccessor accessor) {
        final Long senderId = currentUserId(accessor);
        final MessageResponse response =
                chatMessageService.sendDirectMessage(conversationId, senderId, payload, sessionToken(accessor));
        final Long recipientId = conversationService.getOtherParticipant(conversationId, senderId);

        messagingTemplate.convertAndSend(AppConstants.QUEUE_USER_PREFIX + recipientId + AppConstants.DM_SUFFIX, response);
        messagingTemplate.convertAndSend(AppConstants.QUEUE_USER_PREFIX + senderId + AppConstants.DM_SUFFIX, response);
        log.debug("WS direct message from profile {} delivered in conversation {}", senderId, conversationId);
    }

    /**
     * Broadcasts a Nest typing indicator to {@code /topic/nest.{nestId}.typing}.
     *
     * @param nestId  the nest id (from the destination)
     * @param payload the typing payload
     * @param accessor the STOMP header accessor (session identity)
     * @return the typing event, broadcast by {@code @SendTo}
     */
    @MessageMapping("/chat/nest/{nestId}/typing")
    @SendTo("/topic/nest.{nestId}.typing")
    public TypingEventResponse nestTyping(@DestinationVariable final Long nestId,
                                          final TypingEventPayload payload,
                                          final StompHeaderAccessor accessor) {
        final Long senderId = currentUserId(accessor);
        log.debug("WS typing in nest {} from profile {} (isTyping: {})", nestId, senderId, payload.getIsTyping());
        return TypingEventResponse.builder()
                .senderId(senderId)
                .senderName(chatMessageService.resolveSenderName(senderId, sessionToken(accessor)))
                .typing(Boolean.TRUE.equals(payload.getIsTyping()))
                .build();
    }

    /**
     * Delivers a direct-message typing indicator to both participants' private
     * queues ({@code /queue/user/{id}/typing}).
     *
     * @param conversationId the conversation id (from the destination)
     * @param payload        the typing payload
     * @param accessor       the STOMP header accessor (session identity)
     */
    @MessageMapping("/chat/dm/{conversationId}/typing")
    public void dmTyping(@DestinationVariable final Long conversationId,
                         final TypingEventPayload payload,
                         final StompHeaderAccessor accessor) {
        final Long senderId = currentUserId(accessor);
        final Long recipientId = conversationService.getOtherParticipant(conversationId, senderId);
        final TypingEventResponse response = TypingEventResponse.builder()
                .senderId(senderId)
                .senderName(chatMessageService.resolveSenderName(senderId, sessionToken(accessor)))
                .typing(Boolean.TRUE.equals(payload.getIsTyping()))
                .build();

        messagingTemplate.convertAndSend(AppConstants.QUEUE_USER_PREFIX + recipientId + AppConstants.TYPING_SUFFIX, response);
        messagingTemplate.convertAndSend(AppConstants.QUEUE_USER_PREFIX + senderId + AppConstants.TYPING_SUFFIX, response);
        log.debug("WS typing in conversation {} from profile {}", conversationId, senderId);
    }

    /**
     * Marks messages as read and broadcasts read-status updates to the rooms
     * the messages belong to.
     *
     * @param request  the mark-read request
     * @param accessor the STOMP header accessor (session identity)
     */
    @MessageMapping("/chat/read")
    public void markRead(final MarkReadRequest request, final StompHeaderAccessor accessor) {
        final Long userId = currentUserId(accessor);
        final MarkReadResult result = readReceiptService.markRead(userId, request.getMessageIds());

        for (final RoomRead roomRead : result.rooms()) {
            final RoomRef room = roomRead.room();
            final ReadReceiptUpdateResponse update = ReadReceiptUpdateResponse.builder()
                    .userId(userId)
                    .messageIds(roomRead.messageIds())
                    .roomType(room.roomType())
                    .nestId(room.nestId())
                    .conversationId(room.conversationId())
                    .build();

            if (room.roomType() == RoomType.NEST_GROUP && room.nestId() != null) {
                messagingTemplate.convertAndSend(
                        AppConstants.TOPIC_NEST_PREFIX + room.nestId() + AppConstants.TOPIC_READ_SUFFIX, update);
            } else if (room.roomType() == RoomType.DIRECT && room.conversationId() != null) {
                try {
                    final Long other = conversationService.getOtherParticipant(room.conversationId(), userId);
                    messagingTemplate.convertAndSend(
                            AppConstants.QUEUE_USER_PREFIX + other + AppConstants.READ_SUFFIX, update);
                } catch (final ForbiddenException e) {
                    // The reader is not a participant of this conversation, so
                    // there is no legitimate recipient for the update. The
                    // receipts themselves are still created, matching the REST
                    // mark-read endpoint's behavior.
                    log.warn("Skipping read broadcast for conversation {}: {}", room.conversationId(), e.getMessage());
                }
            }
        }
        log.debug("WS read receipts created for profile {} ({})", userId, result.markedCount());
    }

    /**
     * Returns the authenticated profile id stored on the WebSocket session by
     * the JWT channel interceptor.
     *
     * @param accessor the STOMP header accessor
     * @return the profile id
     */
    private Long currentUserId(final StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof final AuthenticatedUser user) {
            return user.userId();
        }
        throw new UnauthorizedException("No authenticated user on WebSocket session");
    }

    /**
     * Returns the raw Authorization header stored on the session by the JWT
     * channel interceptor at CONNECT time, so WebSocket-originated Feign calls
     * can forward it explicitly (thread-local propagation is unreliable on the
     * STOMP inbound channel).
     *
     * @param accessor the STOMP header accessor
     * @return the raw Authorization header value, or {@code null}
     */
    private String sessionToken(final StompHeaderAccessor accessor) {
        final Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            final Object token = sessionAttributes.get(AppConstants.WS_SESSION_TOKEN);
            if (token != null) {
                return token.toString();
            }
        }
        return null;
    }
}
