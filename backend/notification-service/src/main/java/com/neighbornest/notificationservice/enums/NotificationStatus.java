package com.neighbornest.notificationservice.enums;

/**
 * The lifecycle status of a notification.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum NotificationStatus {

    /** Created but not yet dispatched. */
    PENDING,

    /** Successfully dispatched. */
    SENT,

    /** Dispatch failed (e.g. no email address or SMTP failure). */
    FAILED,

    /** Delivered and read by the user. */
    READ
}
