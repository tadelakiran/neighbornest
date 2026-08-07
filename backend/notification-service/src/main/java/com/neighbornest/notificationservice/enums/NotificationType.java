package com.neighbornest.notificationservice.enums;

/**
 * The category of a notification, used for inbox display and preference
 * gating.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum NotificationType {

    /** A Nest was created and the user was added as a member. */
    NEST_CREATED,

    /** A Nest the user belonged to graduated. */
    NEST_GRADUATED,

    /** A Nest the user belonged to was disbanded. */
    NEST_DISBANDED,

    /** A scheduled meeting is coming up. */
    MEETING_REMINDER,

    /** An expense split is awaiting settlement. */
    EXPENSE_SPLIT,

    /** A vibe check is due. */
    VIBE_CHECK_DUE,

    /** A direct/group chat message arrived while the user was offline. */
    CHAT_MESSAGE,

    /** Generic system notification. */
    SYSTEM
}
