package com.neighbornest.nest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity representing a member's vibe check submission for a Nest.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "vibe_checks", indexes = {
        @Index(name = "idx_vibe_nest", columnList = "nest_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VibeCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nest_id", nullable = false)
    private Long nestId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "connection_score", nullable = false)
    private int connectionScore;

    @Column(name = "comfort_score", nullable = false)
    private int comfortScore;

    @Column(length = 2000)
    private String feedback;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    /**
     * Sets the {@code submittedAt} timestamp before persisting for the first time.
     */
    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }
}
