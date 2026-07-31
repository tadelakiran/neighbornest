package com.neighbornest.matching.security;

/**
 * Principal representing an authenticated user within the Matching Service.
 * <p>
 * Holds the {@code userId} extracted from the validated JWT so controllers
 * and services can identify the current user.
 * </p>
 *
 * @param userId the auth-service user ID from the JWT
 * @param email  the email from the JWT (may be {@code null} if not present)
 * @author NeighborNest Team
 * @version 1.0.0
 */
public record AuthenticatedUser(Long userId, String email) {
}
