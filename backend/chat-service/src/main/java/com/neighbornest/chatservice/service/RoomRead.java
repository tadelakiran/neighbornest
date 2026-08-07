package com.neighbornest.chatservice.service;

import java.util.List;

/**
 * The message ids of a single room that were affected by a batch
 * mark-as-read operation.
 *
 * @param room       the room the messages belong to
 * @param messageIds the message ids in that room
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record RoomRead(RoomRef room, List<Long> messageIds) {
}
