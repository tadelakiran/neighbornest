package com.neighbornest.chatservice.event;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Mirror of the nest-service {@code NestCreatedEvent} published on the
 * {@code nest.events} RabbitMQ exchange.
 * <p>
 * The payload shape matches the record serialized by the nest-service (JSON
 * via {@code Jackson2JsonMessageConverter}), so field names and types are
 * identical.
 * </p>
 *
 * @param nestId        the id of the created Nest
 * @param name          the Nest name
 * @param city          the Nest city
 * @param memberUserIds profile ids of the Nest members
 * @param anchorUserIds profile ids of the Nest anchors
 * @param createdAt     when the Nest was created
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
