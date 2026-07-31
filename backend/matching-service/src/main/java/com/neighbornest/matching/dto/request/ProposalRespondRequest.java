package com.neighbornest.matching.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for a user accepting or declining a proposal.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for responding to a Nest formation proposal")
public class ProposalRespondRequest {

    @NotNull(message = "Accept flag is required")
    @Schema(description = "Whether the user accepts the proposal", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
    private Boolean accept;
}
