package com.neighbornest.notificationservice.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.notificationservice.enums.TrackedNestStatus;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A lightweight, event-sourced registry of Nests the notification service has
 * seen.
 * <p>
 * Populated from {@code nest.created} events (which carry the member list), it
 * lets lifecycle notifications (graduation / disband) resolve recipients
 * without an authenticated nest-service lookup. The nest-service requires a
 * valid JWT on {@code GET /api/nests/{nestId}} and the RabbitMQ consumer
 * thread has no user token to forward, so without this registry the
 * graduation/disband paths could never resolve their audience. Member ids are
 * stored as a JSON array in a {@code TEXT} column.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(
        name = "tracked_nests",
        uniqueConstraints = @UniqueConstraint(name = "uk_tracked_nest_id", columnNames = "nest_id")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackedNest {

    /** JSON mapper for the member id list. */
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Type reference for {@code List<Long>} deserialization. */
    private static final TypeReference<List<Long>> MEMBER_IDS_TYPE = new TypeReference<>() {
    };

    /** Primary key, auto-generated. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The nest-service Nest id (unique). */
    @Column(name = "nest_id", nullable = false, unique = true)
    private Long nestId;

    /** Name of the Nest. */
    @Column(nullable = false, length = 150)
    private String name;

    /** City where the Nest is based. */
    @Column(length = 100)
    private String city;

    /** Current lifecycle status of the tracked Nest. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TrackedNestStatus status;

    /** Member profile ids as a JSON array string. */
    @Column(name = "member_user_ids", nullable = false, columnDefinition = "TEXT")
    private String memberUserIdsJson;

    /** Timestamp when the Nest was first tracked. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Timestamp when the tracking data was last updated. */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Assigns timestamps before the first persist.
     */
    @PrePersist
    void onCreate() {
        final LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    /**
     * Refreshes the update timestamp before each update.
     */
    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Stores the member ids as a JSON array (never {@code null}).
     *
     * @param memberIds the member profile ids (may be null)
     */
    public void setMemberIds(final List<Long> memberIds) {
        try {
            memberUserIdsJson = MAPPER.writeValueAsString(memberIds == null ? List.of() : memberIds);
        } catch (final Exception e) {
            memberUserIdsJson = "[]";
        }
    }

    /**
     * Returns the stored member ids, tolerating malformed or missing data.
     *
     * @return the member profile ids, or an empty list
     */
    public List<Long> memberIdsAsList() {
        if (memberUserIdsJson == null || memberUserIdsJson.isBlank()) {
            return List.of();
        }
        try {
            return MAPPER.readValue(memberUserIdsJson, MEMBER_IDS_TYPE);
        } catch (final Exception e) {
            return List.of();
        }
    }
}
