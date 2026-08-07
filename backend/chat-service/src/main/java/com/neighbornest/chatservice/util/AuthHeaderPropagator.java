package com.neighbornest.chatservice.util;

/**
 * Thread-local holder for the raw Authorization header value when code runs
 * outside an HTTP request context (e.g. STOMP frame processing).
 * <p>
 * The Feign request interceptor falls back to this holder when no HTTP request
 * is active, allowing the WebSocket layer to re-authenticate downstream
 * service calls (nest-service membership checks) with the token presented at
 * CONNECT time. The value must be cleared in a {@code finally} block after
 * use.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public final class AuthHeaderPropagator {

    private static final ThreadLocal<String> TOKEN = new ThreadLocal<>();

    private AuthHeaderPropagator() {
        // Utility class — no instances.
    }

    /**
     * Stores the Authorization header value for the current thread.
     *
     * @param authorizationHeader the raw header value (e.g. "Bearer &lt;token&gt;")
     */
    public static void setToken(final String authorizationHeader) {
        TOKEN.set(authorizationHeader);
    }

    /**
     * Returns the Authorization header value stored for the current thread.
     *
     * @return the raw header value, or {@code null}
     */
    public static String getToken() {
        return TOKEN.get();
    }

    /**
     * Clears the stored value for the current thread.
     */
    public static void clear() {
        TOKEN.remove();
    }
}
