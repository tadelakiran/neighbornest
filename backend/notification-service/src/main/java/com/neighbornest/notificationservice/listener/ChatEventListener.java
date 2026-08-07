package com.neighbornest.notificationservice.listener;

import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.enums.NotificationType;
import com.neighbornest.notificationservice.event.ChatMessageEvent;
import com.neighbornest.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumes chat message events for offline push notifications.
 * <p>
 * <strong>Phase 1.5:</strong> the chat-service does not publish
 * {@code chat.message.sent} events yet, so this listener is currently
 * exercised only when a producer exists. When it fires, the recipient gets an
 * in-app {@code CHAT_MESSAGE} notification (cheap, useful, no external
 * dependency); the offline-email path is a documented TODO once a presence
 * service can tell us whether the recipient has a live WebSocket session.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatEventListener {

    private final NotificationService notificationService;

    /** Maximum preview length for a chat message notification. */
    private static final int MESSAGE_PREVIEW_MAX = 120;

    /**
     * Handles a chat message event: stores an in-app notification for the
     * recipient.
     *
     * @param event the chat message event
     */
    @RabbitListener(queues = "${app.notification.events.chat-queue}")
    public void handleChatMessage(final ChatMessageEvent event) {
        log.info("Received chat.message.sent event for message {}", event.messageId());
        if (event.recipientId() == null) {
            log.warn("Chat message event {} carried no recipient id; skipping", event.messageId());
            return;
        }
        // TODO(phase 1.5): once a presence service exists, check whether the
        // recipient has an active WebSocket session. If offline, resolve the
        // sender's name and send the "New message from {senderName}" offline
        // email instead of (or in addition to) the in-app row below.
        final String preview = preview(event.content());
        notificationService.dispatchInApp(
                event.recipientId(),
                NotificationType.CHAT_MESSAGE,
                "New message",
                preview,
                "CHAT",
                event.messageId());
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
