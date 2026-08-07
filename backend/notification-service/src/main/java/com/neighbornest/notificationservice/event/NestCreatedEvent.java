package com.neighbornest.notificationservice.event;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Event DTO mirroring the {@code NestCreatedEvent} published by the
 * nest-service on the {@code nest.events} exchange (routing key
 * {@code nest.created}). Field names match the nest-service record so the
 * JSON message converter deserializes the payload losslessly.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record NestCreatedEvent(
        Long nestId,
        String name,
        String city,
        List<Long> memberUserIds,
        List<Long> anchorUserIds,
        LocalDateTime createdAt
) implements Serializable {
}
