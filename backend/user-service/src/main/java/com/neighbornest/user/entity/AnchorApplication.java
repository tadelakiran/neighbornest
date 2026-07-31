package com.neighbornest.user.entity;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity representing an application to become a local Anchor.
 * <p>
 * Stores the applicant's local knowledge, languages, experience and
 * availability along with an approval workflow status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "anchor_applications", indexes = {
        @Index(name = "idx_anchor_profile", columnList = "user_profile_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnchorApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_profile_id", nullable = false)
    private Long userProfileId;

    @Column(name = "years_in_city", nullable = false)
    private int yearsInCity;

    @Column(name = "neighborhoods_known", columnDefinition = "TEXT")
    private String neighborhoodsKnown;

    @Column(name = "languages_spoken", length = 500)
    private String languagesSpoken;

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(length = 500)
    private String availability;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AnchorStatus status = AnchorStatus.PENDING;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    /**
     * Sets the {@code appliedAt} timestamp before persisting for the first time.
     */
    @PrePersist
    protected void onCreate() {
        this.appliedAt = LocalDateTime.now();
    }
}
