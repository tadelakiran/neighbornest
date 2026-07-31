package com.neighbornest.matching.dto.request;

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
    @Size(min = 3, max = 8, message = "A Nest proposal requires between 3 and 8 members")
    @Schema(description = "User profile IDs of the proposed members", example = "[1, 2, 3]", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Long> userIds;

    @Schema(description = "User profile IDs that should act as Anchors", example = "[4]")
    private List<Long> anchorIds;
}
