package com.neighbornest.nest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.nest.entity.MeetingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a Nest meeting.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A scheduled Nest meeting")
public class MeetingResponse {

    @Schema(description = "Meeting ID", example = "1")
    private Long id;

    @Schema(description = "Date and time of the meeting", example = "2025-02-01T18:30:00")
    @JsonProperty("scheduled_at")
    private LocalDateTime scheduledAt;

    @Schema(description = "Name of the venue", example = "Blue Bottle Coffee")
    @JsonProperty("venue_name")
    private String venueName;

    @Schema(description = "Address of the venue", example = "315 Linden St, San Francisco")
    @JsonProperty("venue_address")
    private String venueAddress;

    @Schema(description = "Type of activity", example = "Coffee & Chat")
    @JsonProperty("activity_type")
    private String activityType;

    @Schema(description = "Description of the meeting", example = "Weekly catch-up over coffee")
    private String description;

    @Schema(description = "Meeting status", example = "SCHEDULED")
    private MeetingStatus status;
}
