package com.neighbornest.notificationservice.security;

import java.security.Principal;

/**
 * Principal representing an authenticated user within the Notification
 * Service.
 *
 * @param userId the auth-service user id from the JWT
 * @param email  the email from the JWT (may be {@code null})
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record AuthenticatedUser(Long userId, String email) implements Principal {

    /**
     * Returns the principal name (the user id).
     *
     * @return the user id as a string
     */
    @Override
    public String getName() {
        return String.valueOf(userId);
    }
}
