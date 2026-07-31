package com.neighbornest.nest.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for scheduling a Nest meeting.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for scheduling a Nest meeting")
public class MeetingRequest {

    @NotNull(message = "Scheduled time is required")
    @Future(message = "Scheduled time must be in the future")
    @Schema(description = "Date and time of the meeting", example = "2025-02-01T18:30:00", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDateTime scheduledAt;

    @NotBlank(message = "Venue name is required")
    @Size(max = 100, message = "Venue name must not exceed 100 characters")
    @Schema(description = "Name of the venue", example = "Blue Bottle Coffee", requiredMode = Schema.RequiredMode.REQUIRED)
    private String venueName;

    @Size(max = 255, message = "Venue address must not exceed 255 characters")
    @Schema(description = "Address of the venue", example = "315 Linden St, San Francisco")
    private String venueAddress;

    @NotBlank(message = "Activity type is required")
    @Size(max = 100, message = "Activity type must not exceed 100 characters")
    @Schema(description = "Type of activity", example = "Coffee & Chat", requiredMode = Schema.RequiredMode.REQUIRED)
    private String activityType;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    @Schema(description = "Description of the meeting", example = "Weekly catch-up over coffee")
    private String description;
}
