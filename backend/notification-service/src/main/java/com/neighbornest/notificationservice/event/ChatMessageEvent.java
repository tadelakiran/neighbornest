package com.neighbornest.notificationservice.event;

import java.io.Serializable;
import java.util.List;

/**
 * Event DTO for chat message notifications.
 * <p>
 * Published by the chat-service on the {@code nest.events} topic exchange with
 * the {@code chat.message.sent} routing key. Direct messages carry a single
 * {@code recipientId}; group messages carry the full {@code recipientIds} list
 * (active Nest members except the sender) so no authenticated nest-service
 * call is needed on the AMQP consumer thread.
 * </p>
 *
 * @param messageId      the persisted message id
 * @param senderId       the sender's profile id
 * @param recipientId    the direct-message recipient's profile id
 *                       ({@code null} for group messages)
 * @param recipientIds   the recipient profile ids for group messages
 *                       (empty for direct messages)
 * @param content        the sanitized message content (preview source)
 * @param roomType       the room type ({@code NEST_GROUP} or {@code DIRECT})
 * @param nestId         the nest id for group messages (may be {@code null})
 * @param conversationId the conversation id for direct messages (may be {@code null})
 */
public record ChatMessageEvent(
        Long messageId,
        Long senderId,
        Long recipientId,
        List<Long> recipientIds,
        String content,
        String roomType,
        Long nestId,
        Long conversationId
) implements Serializable {
}
