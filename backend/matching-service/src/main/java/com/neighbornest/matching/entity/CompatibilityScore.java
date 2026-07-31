package com.neighbornest.matching.entity;

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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * JPA entity storing the compatibility score between two users.
 * <p>
 * {@code userId1} and {@code userId2} reference {@code UserProfile} IDs from
 * the user-service. Scores are expressed on a 0-100 scale per dimension.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "compatibility_scores", indexes = {
        @Index(name = "idx_compat_user1", columnList = "user_id_1"),
        @Index(name = "idx_compat_user2", columnList = "user_id_2"),
        @Index(name = "idx_compat_pair", columnList = "user_id_1, user_id_2")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompatibilityScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id_1", nullable = false)
    private Long userId1;

    @Column(name = "user_id_2", nullable = false)
    private Long userId2;

    @Column(name = "overall_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal overallScore;

    @Column(name = "values_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal valuesScore;

    @Column(name = "lifestyle_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal lifestyleScore;

    @Column(name = "interest_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestScore;

    @Column(name = "calculated_at", nullable = false, updatable = false)
    private LocalDateTime calculatedAt;

    /**
     * Sets the {@code calculatedAt} timestamp before persisting for the first time.
     */
    @PrePersist
    protected void onCreate() {
        this.calculatedAt = LocalDateTime.now();
    }

    /**
     * Rounds a raw score to two decimal places.
     *
     * @param raw the raw computed score
     * @return the rounded score
     */
    public static BigDecimal roundScore(final double raw) {
        return BigDecimal.valueOf(raw).setScale(2, RoundingMode.HALF_UP);
    }
}
