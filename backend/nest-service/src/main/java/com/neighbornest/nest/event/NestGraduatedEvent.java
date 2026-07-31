package com.neighbornest.nest.event;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Event published to RabbitMQ when a Nest graduates.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record NestGraduatedEvent(
        Long nestId,
        String name,
        String city,
        LocalDate startDate,
        LocalDateTime graduatedAt
) implements Serializable {
}
