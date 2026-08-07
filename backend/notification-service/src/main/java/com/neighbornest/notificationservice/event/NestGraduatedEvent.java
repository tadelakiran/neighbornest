package com.neighbornest.notificationservice.event;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Event DTO mirroring the {@code NestGraduatedEvent} published by the
 * nest-service on the {@code nest.events} exchange (routing key
 * {@code nest.graduated}). The payload does not carry member ids, so listeners
 * resolve the member list through the nest-service when processing it.
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
