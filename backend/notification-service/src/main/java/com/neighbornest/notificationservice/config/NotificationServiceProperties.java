package com.neighbornest.notificationservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Type-safe configuration properties under the {@code app.notification} prefix.
 * <p>
 * Holds the deep-link base URL used in emails and the RabbitMQ event queue
 * bindings so no broker configuration is hardcoded.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@ConfigurationProperties(prefix = "app.notification")
public class NotificationServiceProperties {

    /** Base URL used to build deep links in emails. */
    private String baseUrl;

    /** Nest/chat lifecycle event queue bindings. */
    private Events events = new Events();

    /**
     * RabbitMQ event queue bindings.
     */
    @Data
    public static class Events {

        /** Topic exchange name the nest-service publishes events to. */
        private String exchange;

        /** Durable queue bound for Nest-created events. */
        private String createdQueue;

        /** Durable queue bound for Nest-graduated events. */
        private String graduatedQueue;

        /** Durable queue bound for Nest-disbanded events (future). */
        private String disbandedQueue;

        /** Durable queue bound for chat offline-push events (future). */
        private String chatQueue;

        /** Routing key for Nest-created events. */
        private String createdRoutingKey;

        /** Routing key for Nest-graduated events. */
        private String graduatedRoutingKey;

        /** Routing key for Nest-disbanded events. */
        private String disbandedRoutingKey;

        /** Routing key for chat message events. */
        private String chatRoutingKey;
    }
}
