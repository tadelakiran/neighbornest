package com.neighbornest.nest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO aggregating vibe check scores for a Nest (admin view).
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Aggregated vibe check status for a Nest")
public class VibeCheckStatusResponse {

    @Schema(description = "Average connection score (1-10)", example = "7.50")
    @JsonProperty("average_connection")
    private BigDecimal averageConnection;

    @Schema(description = "Average comfort score (1-10)", example = "8.25")
    @JsonProperty("average_comfort")
    private BigDecimal averageComfort;

    @Schema(description = "Overall average score (1-10)", example = "7.88")
    @JsonProperty("overall_average")
    private BigDecimal overallAverage;

    @Schema(description = "Number of submissions", example = "4")
    private long submissionCount;

    @Schema(description = "Individual submissions")
    private List<VibeCheckResponse> submissions;
}
