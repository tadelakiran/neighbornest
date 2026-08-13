package com.neighbornest.user.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Publishes user-service domain events to RabbitMQ.
 * <p>
 * Uses the JSON message converter configured in {@code RabbitMQConfig} so
 * consumers receive typed POJOs. Publishing is best-effort: a broker hiccup
 * must never fail the originating operation (the review already committed).
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.user.event.exchange}")
    private String exchange;

    @Value("${app.user.event.anchor-reviewed-routing-key}")
    private String anchorReviewedRoutingKey;

    /**
     * Publishes an Anchor application review event.
     *
     * @param event the event to publish
     */
    public void publishAnchorApplicationReviewed(final AnchorApplicationReviewedEvent event) {
        try {
            rabbitTemplate.convertAndSend(exchange, anchorReviewedRoutingKey, event);
            log.info("Published AnchorApplicationReviewedEvent for application {} (decision {})",
                    event.applicationId(), event.decision());
        } catch (final Exception e) {
            // Notifications are best-effort: never fail the review over a broker issue.
            log.warn("Could not publish AnchorApplicationReviewedEvent for application {}",
                    event.applicationId(), e);
        }
    }
}
