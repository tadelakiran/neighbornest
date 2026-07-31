package com.neighbornest.nest.event;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Event published to RabbitMQ when a Nest moves to the ACTIVE status.
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
