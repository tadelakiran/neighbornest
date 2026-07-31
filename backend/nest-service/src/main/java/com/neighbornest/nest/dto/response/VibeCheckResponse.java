package com.neighbornest.nest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a single vibe check submission.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A submitted Nest vibe check")
public class VibeCheckResponse {

    @Schema(description = "User profile ID who submitted the check", example = "7")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Connection score (1-10)", example = "8")
    @JsonProperty("connection_score")
    private int connectionScore;

    @Schema(description = "Comfort score (1-10)", example = "9")
    @JsonProperty("comfort_score")
    private int comfortScore;

    @Schema(description = "Optional written feedback", example = "Loving the group energy!")
    private String feedback;

    @Schema(description = "Timestamp when the check was submitted", example = "2025-02-01T10:30:00")
    @JsonProperty("submitted_at")
    private LocalDateTime submittedAt;
}
