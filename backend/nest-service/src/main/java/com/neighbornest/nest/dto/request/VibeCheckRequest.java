package com.neighbornest.nest.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for submitting a vibe check.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for submitting a Nest vibe check")
public class VibeCheckRequest {

    @NotNull(message = "Connection score is required")
    @Min(value = 1, message = "Connection score must be between 1 and 10")
    @Max(value = 10, message = "Connection score must be between 1 and 10")
    @Schema(description = "How connected the member feels (1-10)", example = "8", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer connectionScore;

    @NotNull(message = "Comfort score is required")
    @Min(value = 1, message = "Comfort score must be between 1 and 10")
    @Max(value = 10, message = "Comfort score must be between 1 and 10")
    @Schema(description = "How comfortable the member feels (1-10)", example = "9", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer comfortScore;

    @Size(max = 2000, message = "Feedback must not exceed 2000 characters")
    @Schema(description = "Optional written feedback", example = "Loving the group energy!")
    private String feedback;
}
