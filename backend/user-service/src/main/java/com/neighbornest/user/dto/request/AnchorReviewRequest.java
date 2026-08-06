package com.neighbornest.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for reviewing an anchor application (admin action).
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for reviewing an anchor application")
public class AnchorReviewRequest {

    /** The decision an admin makes on a pending application. */
    public enum ReviewDecision {
        APPROVE,
        REJECT
    }

    @NotNull(message = "Decision is required")
    @Schema(description = "Approve or reject the application", example = "APPROVE", requiredMode = Schema.RequiredMode.REQUIRED)
    private ReviewDecision decision;

    @Size(max = 1000, message = "Review note must not exceed 1000 characters")
    @Schema(description = "Optional note explaining the decision", example = "Strong local knowledge and availability")
    private String note;
}
