package com.neighbornest.chatservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A direct-message conversation between exactly two users.
 * <p>
 * Participant ids are normalised at creation so {@code participant1Id} always
 * holds the smaller id and {@code participant2Id} the larger one. The unique
 * constraint on the pair guarantees at most one conversation between any two
 * users.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(
        name = "conversations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_conversation_participants",
                columnNames = {"participant1_id", "participant2_id"}
        )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    /** Primary key, auto-generated. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** First participant (the smaller user-service profile id). */
    @Column(name = "participant1_id", nullable = false)
    private Long participant1Id;

    /** Second participant (the larger user-service profile id). */
    @Column(name = "participant2_id", nullable = false)
    private Long participant2Id;

    /** Timestamp when the conversation was created. */
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
