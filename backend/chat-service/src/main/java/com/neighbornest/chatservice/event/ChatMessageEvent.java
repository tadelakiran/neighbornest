package com.neighbornest.chatservice.event;

import java.io.Serializable;
import java.util.List;

/**
 * Event DTO for chat message notifications.
 * <p>
 * Published on the shared {@code nest.events} topic exchange with the
 * {@code chat.message.sent} routing key after a message is persisted. The
 * notification-service consumes it and creates per-recipient in-app
 * notifications (DMs target the other participant; group messages fan out to
 * every other active Nest member).
 * </p>
 * <p>
 * Group messages carry the {@code recipientIds} list so the consumer does not
 * need to call back into the nest-service (which requires a user JWT the
 * AMQP consumer thread does not have).
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

