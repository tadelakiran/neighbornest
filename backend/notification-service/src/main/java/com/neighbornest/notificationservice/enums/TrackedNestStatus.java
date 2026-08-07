package com.neighbornest.notificationservice.enums;

/**
 * Lifecycle status of a locally tracked Nest.
 * <p>
 * The notification service keeps a lightweight, event-sourced registry of the
 * Nests it has seen (populated from {@code nest.created} events) so lifecycle
 * notifications (graduation / disband) can resolve recipients without an
 * authenticated nest-service lookup — the RabbitMQ consumer thread has no user
 * JWT to forward.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum TrackedNestStatus {

    /** The Nest is active and its members are being notified. */
    ACTIVE,

    /** The Nest graduated; the registry keeps the data for reference. */
    GRADUATED,

    /** The Nest was disbanded. */
    DISBANDED
}
