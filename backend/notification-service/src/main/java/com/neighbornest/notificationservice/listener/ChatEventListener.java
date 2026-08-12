package com.neighbornest.notificationservice.listener;

import com.neighbornest.notificationservice.client.NestMemberResponse;
import com.neighbornest.notificationservice.client.NestResponse;
import com.neighbornest.notificationservice.client.NestServiceClient;
import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.enums.NotificationType;
import com.neighbornest.notificationservice.event.ChatMessageEvent;
import com.neighbornest.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Consumes {@code chat.message.sent} events and creates per-recipient in-app
 * notifications.
 * <p>
 * The chat-service publishes one event per persisted message:
 * <ul>
 *   <li><strong>Direct messages</strong> carry the recipient's profile id —
 *       a single {@code CHAT_MESSAGE} inbox row is created for them;</li>
 *   <li><strong>Group (Nest) messages</strong> carry no recipient id — the
 *       Nest's active members (excluding the sender) are resolved via the
 *       nest-service and each gets an inbox row, so every individual in the
 *       group is notified.</li>
 * </ul>
 * The offline-email path is a documented TODO once a presence service can
 * tell us whether the recipient has a live WebSocket session.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.1.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatEventListener {

    private final NotificationService notificationService;
    private final NestServiceClient nestServiceClient;

    /** Maximum preview length for a chat message notification. */
    private static final int MESSAGE_PREVIEW_MAX = 120;

    /** Room type value published by the chat-service for group messages. */
    private static final String ROOM_TYPE_NEST_GROUP = "NEST_GROUP";

    /**
     * Handles a chat message event: stores an in-app notification for the
     * recipient (DMs) or every other active Nest member (group messages).
     *
     * @param event the chat message event
     */
    @RabbitListener(queues = "${app.notification.events.chat-queue}")
    public void handleChatMessage(final ChatMessageEvent event) {
        log.info("Received chat.message.sent event for message {}", event.messageId());
        if (event.senderId() == null) {
            log.warn("Chat message event {} carried no sender id; skipping", event.messageId());
            return;
        }
        if (ROOM_TYPE_NEST_GROUP.equals(event.roomType()) && event.nestId() != null) {
            notifyNestMembers(event);
            return;
        }
        if (event.recipientId() == null) {
            log.warn("Chat message event {} carried no recipient id; skipping", event.messageId());
            return;
        }
        // Never notify the sender about their own message.
        if (event.recipientId().equals(event.senderId())) {
            log.debug("Skipping notification for message {} (sender == recipient)", event.messageId());
            return;
        }
        dispatchInApp(event.recipientId(), "New message", preview(event.content()), event.messageId());
    }

    /**
     * Fans out a group chat notification to every recipient the chat-service
     * embedded in the event (active Nest members except the sender). Falls back
     * to a nest-service lookup when the list is empty (e.g. older publishers).
     *
     * @param event the chat message event (room type {@code NEST_GROUP})
     */
    private void notifyNestMembers(final ChatMessageEvent event) {
        final String nestName;
        final List<Long> memberIds;
        if (event.recipientIds() != null && !event.recipientIds().isEmpty()) {
            memberIds = event.recipientIds().stream()
                    .filter(id -> id != null && !id.equals(event.senderId()))
                    .distinct()
                    .toList();
            nestName = null;
        } else {
            final NestResponse nest;
            try {
                nest = nestServiceClient.getNest(event.nestId());
            } catch (final Exception e) {
                log.warn("Could not resolve nest {} for chat notification; skipping group fan-out",
                        event.nestId(), e);
                return;
            }
            if (nest == null || nest.getMembers() == null) {
                log.warn("Nest {} returned no members; skipping group chat notifications", event.nestId());
                return;
            }
            nestName = nest.getName();
            memberIds = nest.getMembers().stream()
                    .filter(m -> m != null && AppConstants.NEST_MEMBER_STATUS_ACCEPTED.equals(m.getStatus()))
                    .map(NestMemberResponse::getUserId)
                    .filter(id -> id != null && !id.equals(event.senderId()))
                    .distinct()
                    .toList();
        }
        if (memberIds.isEmpty()) {
            log.warn("No recipients for group chat message {}; skipping fan-out", event.messageId());
            return;
        }
        final String title = nestName != null
                ? "New message in " + nestName
                : "New message in your Nest";
        for (final Long memberId : memberIds) {
            dispatchInApp(memberId, title, preview(event.content()), event.messageId());
        }
    }

    /**
     * Stores a {@code CHAT_MESSAGE} in-app notification for a recipient.
     *
     * @param recipientId the recipient's profile id
     * @param title       the inbox headline
     * @param message     the inbox body (preview)
     * @param messageId   the related chat message id
     */
    private void dispatchInApp(final Long recipientId, final String title, final String message,
                               final Long messageId) {
        try {
            notificationService.dispatchInApp(
                    recipientId,
                    NotificationType.CHAT_MESSAGE,
                    title,
                    message,
                    "CHAT",
                    messageId);
        } catch (final Exception e) {
            // Per-recipient isolation: one failing inbox row must not stop the rest.
            log.warn("Could not create chat notification for user {}", recipientId, e);
        }
    }

    /**
     * Truncates a message body for the notification preview.
     *
     * @param content the raw message content (may be null)
     * @return the preview, or an empty string
     */
    private String preview(final String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        return content.length() <= MESSAGE_PREVIEW_MAX
                ? content
                : content.substring(0, MESSAGE_PREVIEW_MAX).trim() + "…";
    }
}
