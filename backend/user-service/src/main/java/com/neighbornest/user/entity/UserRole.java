package com.neighbornest.user.entity;

/**
 * Platform-level role of a user within NeighborNest.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum UserRole {
    /** A user who is new to the city and looking to join a Nest. */
    NEWCOMER,
    /** A local resident who helps host and guide newcomers. */
    ANCHOR,
    /** Platform administrator. */
    ADMIN
}
