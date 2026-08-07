package com.neighbornest.notificationservice.entity;

import com.neighbornest.notificationservice.enums.NotificationChannel;
import com.neighbornest.notificationservice.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Per-user notification preferences.
 * <p>
 * There is exactly one row per user (unique on {@code userId}). Missing rows
 * are treated as "everything enabled" — the entity defaults reflect that — so
 * users get notifications out of the box and can opt out per channel and per
 * category.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "notification_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreference {

    /** Primary key, auto-generated. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user this preference belongs to (user-service profile id). */
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    /** Master email channel toggle. */
    @Column(name = "email_enabled", nullable = false)
    @Builder.Default
    private boolean emailEnabled = true;

    /** Master SMS channel toggle. */
    @Column(name = "sms_enabled", nullable = false)
    @Builder.Default
    private boolean smsEnabled = false;

    /** Master push channel toggle. */
    @Column(name = "push_enabled", nullable = false)
    @Builder.Default
    private boolean pushEnabled = true;

    /** Meeting reminder category toggle. */
    @Column(name = "meeting_reminders", nullable = false)
    @Builder.Default
    private boolean meetingReminders = true;

    /** Expense alert category toggle. */
    @Column(name = "expense_alerts", nullable = false)
    @Builder.Default
    private boolean expenseAlerts = true;

    /** Vibe check reminder category toggle. */
    @Column(name = "vibe_check_reminders", nullable = false)
    @Builder.Default
    private boolean vibeCheckReminders = true;

    /** Chat notification category toggle. */
    @Column(name = "chat_notifications", nullable = false)
    @Builder.Default
    private boolean chatNotifications = true;

    /** Timestamp when the preference was last updated. */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Assigns the update timestamp before the first persist.
     */
    @PrePersist
    void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Refreshes the update timestamp before each update.
     */
    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Returns whether this preference allows the given notification on the
     * given channel. Both the channel toggle and the category toggle (when one
     * exists) must be enabled.
     *
     * @param type    the notification type
     * @param channel the delivery channel
     * @return {@code true} if the notification should be dispatched
     */
    public boolean allows(final NotificationType type, final NotificationChannel channel) {
        if (channel == NotificationChannel.EMAIL && !emailEnabled) {
            return false;
        }
        if (channel == NotificationChannel.SMS && !smsEnabled) {
            return false;
        }
        if (channel == NotificationChannel.PUSH && !pushEnabled) {
            return false;
        }
        return switch (type) {
            case MEETING_REMINDER -> meetingReminders;
            case EXPENSE_SPLIT -> expenseAlerts;
            case VIBE_CHECK_DUE -> vibeCheckReminders;
            case CHAT_MESSAGE -> chatNotifications;
            default -> true;
        };
    }
}
