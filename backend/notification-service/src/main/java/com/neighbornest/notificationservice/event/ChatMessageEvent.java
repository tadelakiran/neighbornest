package com.neighbornest.notificationservice.event;

import java.io.Serializable;

/**
 * Event DTO for chat message events used for offline push notifications.
 * <p>
 * <strong>Future wiring:</strong> the chat-service does not publish these
 * events yet; the queue and binding are declared in {@code RabbitMQConfig} so
 * the offline-notification path lights up when the chat-service starts
 * publishing {@code chat.message.sent} with this shape.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record ChatMessageEvent(
        Long messageId,
        Long senderId,
        Long recipientId,
        String content,
        String roomType,
        Long nestId,
        Long conversationId
) implements Serializable {
}
