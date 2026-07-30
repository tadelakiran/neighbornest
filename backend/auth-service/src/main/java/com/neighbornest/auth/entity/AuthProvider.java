package com.neighbornest.auth.entity;

/**
 * Enum representing the authentication providers supported by NeighborNest.
 * <p>
 * Tracks whether a user registered via local credentials (email + password)
 * or via a third-party OAuth provider like Google.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum AuthProvider {
    /** Standard email + password registration. Default value. */
    LOCAL,

    /** OAuth 2.0 authentication via Google. */
    GOOGLE
}
