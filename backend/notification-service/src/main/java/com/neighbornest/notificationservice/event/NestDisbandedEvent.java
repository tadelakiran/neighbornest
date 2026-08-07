package com.neighbornest.notificationservice.event;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Event DTO for Nest disband events.
 * <p>
 * <strong>Future wiring:</strong> the nest-service does not publish a
 * disbanded event yet, so no producer emits this today. The queue and binding
 * are already declared in {@code RabbitMQConfig} and the listener is tolerant
 * of missing member data, so the notification path lights up as soon as the
 * nest-service publishes it with the same shape.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record NestDisbandedEvent(
        Long nestId,
        String reason,
        LocalDateTime disbandedAt
) implements Serializable {
}
