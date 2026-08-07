package com.neighbornest.chatservice.event;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Mirror of the nest-service {@code NestGraduatedEvent} published on the
 * {@code nest.events} RabbitMQ exchange.
 * <p>
 * The payload shape matches the record serialized by the nest-service (JSON
 * via {@code Jackson2JsonMessageConverter}), so field names and types are
 * identical.
 * </p>
 *
 * @param nestId      the id of the graduated Nest
 * @param name        the Nest name
 * @param city        the Nest city
 * @param startDate   when the Nest started
 * @param graduatedAt when the Nest graduated
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
