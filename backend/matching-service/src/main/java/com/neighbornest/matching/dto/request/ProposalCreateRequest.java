package com.neighbornest.matching.dto.request;

import com.neighbornest.matching.constants.AppConstants;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for creating a Nest formation proposal.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for creating a Nest formation proposal")
public class ProposalCreateRequest {

    @NotEmpty(message = "At least one member is required")
    @Size(min = AppConstants.MIN_NEST_SIZE, max = AppConstants.MAX_NEST_SIZE,
            message = "A Nest proposal requires between 5 and 8 people total")
    @Schema(description = "User profile IDs of the proposed members including anchors",
            example = "[1, 2, 3, 4, 5]", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Long> userIds;

    @NotEmpty(message = "At least one anchor is required")
    @Size(min = AppConstants.MIN_ANCHORS, max = AppConstants.MAX_ANCHORS,
            message = "A Nest proposal requires between 1 and 2 anchors")
    @Schema(description = "User profile IDs that should act as Anchors", example = "[1]", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Long> anchorIds;
}
