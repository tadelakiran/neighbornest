package com.neighbornest.chatservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Type-safe configuration properties under the {@code app.chat} prefix.
 * <p>
 * Holds the RabbitMQ STOMP relay credentials and the Nest event queue
 * bindings so no broker configuration is hardcoded.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@ConfigurationProperties(prefix = "app.chat")
public class ChatServiceProperties {

    /** STOMP relay connection settings (RabbitMQ STOMP plugin). */
    private Stomp stomp = new Stomp();

    /** Nest lifecycle event queue bindings. */
    private Events events = new Events();

    /**
     * STOMP relay connection settings.
     */
    @Data
    public static class Stomp {

        /** RabbitMQ host for the STOMP relay. */
        private String relayHost;

        /** RabbitMQ STOMP plugin port (default 61613). */
        private int relayPort;

        /** STOMP client login (connection credentials). */
        private String clientLogin;

        /** STOMP client passcode (connection credentials). */
        private String clientPasscode;

        /** STOMP system login (broker admin credentials). */
        private String systemLogin;

        /** STOMP system passcode (broker admin credentials). */
        private String systemPasscode;
    }

    /**
     * Nest lifecycle event queue bindings.
     */
    @Data
    public static class Events {

        /** Topic exchange name the nest-service publishes events to. */
        private String exchange;

        /** Routing key for Nest-created events. */
        private String createdRoutingKey;

        /** Routing key for Nest-graduated events. */
        private String graduatedRoutingKey;

        /** Durable queue bound for Nest-created events. */
        private String createdQueue;

        /** Durable queue bound for Nest-graduated events. */
        private String graduatedQueue;

        /** Routing key for chat message notification events. */
        private String chatRoutingKey;
    }
}
