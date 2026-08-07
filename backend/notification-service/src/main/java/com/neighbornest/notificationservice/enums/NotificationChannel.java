package com.neighbornest.notificationservice.enums;

/**
 * The delivery channel of a notification.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum NotificationChannel {

    /** Delivered via email. */
    EMAIL,

    /** Delivered via SMS (placeholder — Twilio integration pending). */
    SMS,

    /** Delivered through the in-app notification inbox. */
    IN_APP,

    /** Delivered via push notification (future). */
    PUSH
}
