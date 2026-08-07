package com.neighbornest.chatservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tracks that a user has read a specific message.
 * <p>
 * The unique constraint on {@code (message, userId)} makes read receipts
 * idempotent: marking an already-read message is a no-op. Read receipts are
 * the basis for unread counts and the {@code isReadByMe} flag on message
 * responses.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(
        name = "read_receipts",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_read_receipt_message_user",
                columnNames = {"message_id", "user_id"}
        )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceipt {

    /** Primary key, auto-generated. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The message that was read (FK to {@link Message}). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    /** User-service profile id of the reader. */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Timestamp when the message was read. */
    @Column(name = "read_at", nullable = false, updatable = false)
    private LocalDateTime readAt;

    /**
     * Assigns the read timestamp before the first persist.
     */
    @PrePersist
    void onCreate() {
        if (readAt == null) {
            readAt = LocalDateTime.now();
        }
    }
}
