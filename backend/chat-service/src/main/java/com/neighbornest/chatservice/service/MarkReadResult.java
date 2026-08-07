package com.neighbornest.chatservice.service;

import java.util.List;

/**
 * Result of a batch mark-as-read operation: the number of receipts actually
 * created (duplicates are skipped) and, per room, the message ids that were
 * affected, so the WebSocket layer can broadcast read-status updates scoped to
 * each room.
 *
 * @param markedCount the number of newly created read receipts
 * @param rooms       per-room message ids that were marked read
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record MarkReadResult(int markedCount, List<RoomRead> rooms) {
}
