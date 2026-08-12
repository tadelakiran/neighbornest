package com.neighbornest.chatservice.constants;

/**
 * Central constants for the Chat Service.
 * <p>
 * All fixed strings, sizes and prefixes used across the chat domain live here
 * so no magic numbers or magic strings leak into business code.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public final class AppConstants {

    private AppConstants() {
        // Utility class — no instances.
    }

    /** Default page size for message history queries. */
    public static final int DEFAULT_PAGE_SIZE = 50;

    /** Maximum allowed length of a chat message in characters. */
    public static final int MAX_MESSAGE_LENGTH = 2000;

    /** STOMP endpoint registered for WebSocket (SockJS) connections. */
    public static final String WEBSOCKET_ENDPOINT = "/ws/chat";

    /** Client-to-server destination prefix for {@code @MessageMapping} handlers. */
    public static final String APP_DESTINATION_PREFIX = "/app";

    /**
     * Server-to-client broadcast prefix for group (Nest) rooms.
     * <p>
     * Dot-separated on purpose: the RabbitMQ STOMP plugin maps the remainder of
     * a {@code /topic/...} destination onto an AMQP topic routing key, and
     * routing keys are dot-delimited — slashes are rejected with "is not a
     * valid topic destination". So a Nest room is {@code /topic/nest.1.messages}.
     * </p>
     */
    public static final String TOPIC_NEST_PREFIX = "/topic/nest.";

    /** Typing broadcasts share the same topic prefix as group messages. */
    public static final String TOPIC_TYPING_PREFIX = "/topic/nest.";

    /**
     * Server-to-client private queue prefix (DMs, notifications).
     * <p>
     * Dot-separated for the same reason as topics: the RabbitMQ STOMP plugin
     * rejects slashes in destinations, so a user's DM queue is
     * {@code /queue/user.4.dm}.
     * </p>
     */
    public static final String QUEUE_USER_PREFIX = "/queue/user.";

    /** Suffix for the group message broadcast destination. */
    public static final String TOPIC_NEST_MESSAGES_SUFFIX = ".messages";

    /** Suffix for the group typing broadcast destination. */
    public static final String TOPIC_TYPING_SUFFIX = ".typing";

    /** Suffix for the group read-status broadcast destination. */
    public static final String TOPIC_READ_SUFFIX = ".read";

    /** Suffix for the private direct-message queue. */
    public static final String DM_SUFFIX = ".dm";

    /** Suffix for the private typing-indicator queue. */
    public static final String TYPING_SUFFIX = ".typing";

    /** Suffix for the private read-status queue. */
    public static final String READ_SUFFIX = ".read";

    /** Sender id used for auto-generated SYSTEM messages (no real user). */
    public static final long SYSTEM_SENDER_ID = 0L;

    /** Display name used for auto-generated SYSTEM messages. */
    public static final String SYSTEM_SENDER_NAME = "NeighborNest";

    /** Nest membership status value meaning the member is actively in the Nest. */
    public static final String NEST_MEMBER_STATUS_ACCEPTED = "ACCEPTED";

    /** Nest status values that permit chat (active or graduated Nests). */
    public static final String NEST_STATUS_ACTIVE = "ACTIVE";
    public static final String NEST_STATUS_GRADUATED = "GRADUATED";

    /** HTTP header that (when the gateway is configured to add it) carries the
     *  current user's profile id. Identity otherwise comes from the JWT. */
    public static final String X_USER_ID_HEADER = "X-User-Id";

    /** Standard Authorization header name. */
    public static final String AUTHORIZATION_HEADER = "Authorization";

    /** Bearer token prefix. */
    public static final String BEARER_PREFIX = "Bearer ";

    /** WebSocket session attribute key for the authenticated profile id. */
    public static final String WS_SESSION_PROFILE_ID = "ws.profileId";

    /** WebSocket session attribute key for the authenticated email. */
    public static final String WS_SESSION_EMAIL = "ws.email";

    /** WebSocket session attribute key for the raw Authorization header value. */
    public static final String WS_SESSION_TOKEN = "ws.token";
}
