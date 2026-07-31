package com.neighbornest.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity representing a user's NeighborNest profile.
 * <p>
 * Maps to the {@code user_profiles} table. One profile exists per
 * authenticated user; {@code authUserId} references the user ID in the
 * auth-service and is unique.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "auth_user_id", nullable = false, unique = true)
    private Long authUserId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String neighborhood;

    @Column(name = "years_in_city", nullable = false)
    @Builder.Default
    private int yearsInCity = 0;

    @Column(length = 100)
    private String occupation;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", length = 30)
    private WorkType workType;

    @Enumerated(EnumType.STRING)
    @Column(name = "personality_type", length = 30)
    private PersonalityType personalityType;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_preference", length = 30)
    private SchedulePreference schedulePreference;

    @Enumerated(EnumType.STRING)
    @Column(name = "social_goal", length = 30)
    private SocialGoal socialGoal;

    @Enumerated(EnumType.STRING)
    @Column(name = "budget_level", length = 30)
    private BudgetLevel budgetLevel;

    @Column(name = "is_onboarded", nullable = false)
    @Builder.Default
    private boolean isOnboarded = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.NEWCOMER;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Sets the {@code createdAt} timestamp before persisting for the first time.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Updates the {@code updatedAt} timestamp before each update.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
