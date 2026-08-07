package com.neighbornest.notificationservice.entity;

import com.neighbornest.notificationservice.enums.NotificationChannel;
import com.neighbornest.notificationservice.enums.NotificationStatus;
import com.neighbornest.notificationservice.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A single notification record in the {@code notification_db} database.
 * <p>
 * {@code userId} references a user-service profile id (the same id space the
 * other domain services use for users). The {@code relatedEntityType} /
 * {@code relatedEntityId} pair point back at the entity that triggered the
 * notification (a Nest, meeting or expense) without a cross-service foreign
 * key.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(
        name = "notifications",
        indexes = {
                @Index(name = "idx_notifications_user_created", columnList = "user_id, created_at"),
                @Index(name = "idx_notifications_status", columnList = "status")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    /** Primary key, auto-generated. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Recipient's user-service profile id. */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Notification category. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NotificationType type;

    /** Short headline shown in the inbox. */
    @Column(nullable = false, length = 150)
    private String title;

    /** Full notification body. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    /** Delivery channel. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private NotificationChannel channel;

    /** Dispatch lifecycle status. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PENDING;

    /** Type of the related entity ("NEST", "MEETING", "EXPENSE", ...). */
    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType;

    /** Id of the related entity. */
    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    /** Timestamp when the notification was actually dispatched. */
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    /** Timestamp when the user read the notification. */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    /** Timestamp when the notification was created. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Assigns the creation timestamp before the first persist.
     */
    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
