package com.neighbornest.user.entity;

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
 * JPA entity representing a single answer to an onboarding question.
 * <p>
 * Each answer is tied to a {@link UserProfile} by its {@code userProfileId}
 * and carries a {@code questionKey} (e.g. {@code values_adventure}) with an
 * optional weight used by the matching-service scoring engine.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "onboarding_answers", indexes = {
        @Index(name = "idx_answers_profile", columnList = "user_profile_id"),
        @Index(name = "idx_answers_profile_key", columnList = "user_profile_id, question_key")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_profile_id", nullable = false)
    private Long userProfileId;

    @Column(name = "question_key", nullable = false, length = 64)
    private String questionKey;

    @Column(name = "answer_value", nullable = false, length = 500)
    private String answerValue;

    @Column(nullable = false)
    @Builder.Default
    private int weight = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Sets the {@code createdAt} timestamp before persisting for the first time.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
