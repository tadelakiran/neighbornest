package com.neighbornest.chatservice.security;

import java.security.Principal;

/**
 * Principal representing an authenticated user within the Chat Service.
 * <p>
 * <strong>Id space note:</strong> chat rooms and Nest members are keyed by
 * <em>user-service profile ids</em>, not auth-service user ids. On REST the
 * filter stores the raw JWT id (bridged to the profile id via the user-service
 * when needed); on WebSocket the channel interceptor resolves the profile id at
 * CONNECT time and uses it as {@code userId}. {@code token} holds the raw
 * Authorization header value so downstream Feign calls (nest-service
 * membership checks) can re-authenticate when no HTTP request context exists
 * (e.g. STOMP frames).
 * </p>
 *
 * @param userId the chat-domain user id (profile id on WebSocket, auth id on REST)
 * @param email  the email from the JWT (may be {@code null})
 * @param token  the raw Authorization header value (may be {@code null})
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record AuthenticatedUser(Long userId, String email, String token) implements Principal {

    /**
     * Convenience constructor for principals without a propagated token
     * (used by the REST JWT filter).
     *
     * @param userId the user id
     * @param email  the email
     */
    public AuthenticatedUser(final Long userId, final String email) {
        this(userId, email, null);
    }

    /**
     * Returns the principal name (the user id), used by Spring's STOMP user
     * destination resolution ({@code /user/...} destinations).
     *
     * @return the user id as a string
     */
    @Override
    public String getName() {
        return String.valueOf(userId);
    }
}
