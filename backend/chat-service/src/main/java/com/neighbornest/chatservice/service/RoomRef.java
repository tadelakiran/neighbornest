package com.neighbornest.chatservice.service;

import com.neighbornest.chatservice.enums.RoomType;

/**
 * Identifies a chat room by type and its room id, derived from the messages
 * that were affected by an operation (e.g. a batch mark-as-read).
 *
 * @param roomType       the room type
 * @param nestId         the nest id for group rooms, or {@code null}
 * @param conversationId the conversation id for direct rooms, or {@code null}
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record RoomRef(RoomType roomType, Long nestId, Long conversationId) {
}
