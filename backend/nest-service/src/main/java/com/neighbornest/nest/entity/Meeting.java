package com.neighbornest.nest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity representing a scheduled Nest meeting.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "meetings", indexes = {
        @Index(name = "idx_meeting_nest", columnList = "nest_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nest_id", nullable = false)
    private Long nestId;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "venue_name", length = 100)
    private String venueName;

    @Column(name = "venue_address", length = 255)
    private String venueAddress;

    @Column(name = "activity_type", length = 100)
    private String activityType;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MeetingStatus status = MeetingStatus.SCHEDULED;
}
