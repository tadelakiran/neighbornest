package com.neighbornest.notificationservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * External DTO mirroring the nest-service {@code MeetingResponse} payload
 * fields the scheduler needs for meeting reminders.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingResponse {

    /** Meeting id. */
    private Long id;

    /** Date and time of the meeting. */
    @JsonProperty("scheduled_at")
    private LocalDateTime scheduledAt;

    /** Name of the venue. */
    @JsonProperty("venue_name")
    private String venueName;

    /** Type of activity. */
    @JsonProperty("activity_type")
    private String activityType;

    /** Meeting status (SCHEDULED / COMPLETED / CANCELLED). */
    private String status;
}
