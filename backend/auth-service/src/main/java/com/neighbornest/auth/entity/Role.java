package com.neighbornest.auth.entity;

/**
 * Enum representing the possible roles a user can have in the NeighborNest platform.
 * <p>
 * Each role defines the level of access and permissions within the system:
 * <ul>
 *   <li>{@link #NEWCOMER} — a new user who has joined the platform</li>
 *   <li>{@link #ANCHOR} — a local resident who hosts and guides newcomers</li>
 *   <li>{@link #ADMIN} — a system administrator with elevated privileges</li>
 * </ul>
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum Role {
    /** A newcomer who joined the platform. Default role upon registration. */
    NEWCOMER,

    /** A local resident who hosts and guides newcomers in a Nest. */
    ANCHOR,

    /** A system administrator with elevated privileges. */
    ADMIN
}
