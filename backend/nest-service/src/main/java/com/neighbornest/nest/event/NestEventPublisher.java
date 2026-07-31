package com.neighbornest.nest.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Publishes Nest lifecycle events to RabbitMQ.
 * <p>
 * Uses a JSON message converter (see {@code RabbitMQConfig}) so consumers
 * receive typed POJOs.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NestEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.nest.event-exchange}")
    private String exchange;

    @Value("${app.nest.created-routing-key}")
    private String createdRoutingKey;

    @Value("${app.nest.graduated-routing-key}")
    private String graduatedRoutingKey;

    /**
     * Publishes a Nest created event.
     *
     * @param event the event to publish
     */
    public void publishNestCreated(final NestCreatedEvent event) {
        log.info("Publishing NestCreatedEvent for nest: {}", event.nestId());
        rabbitTemplate.convertAndSend(exchange, createdRoutingKey, event);
    }

    /**
     * Publishes a Nest graduated event.
     *
     * @param event the event to publish
     */
    public void publishNestGraduated(final NestGraduatedEvent event) {
        log.info("Publishing NestGraduatedEvent for nest: {}", event.nestId());
        rabbitTemplate.convertAndSend(exchange, graduatedRoutingKey, event);
    }
}
