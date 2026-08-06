package com.neighbornest.matching.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned when an accepted proposal is executed and a Nest is
 * created in the nest-service.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Result of executing an accepted proposal")
public class ProposalExecutionResponse {

    @Schema(description = "ID of the executed proposal", example = "12")
    @JsonProperty("proposal_id")
    private Long proposalId;

    @Schema(description = "ID of the Nest created in the nest-service", example = "5")
    @JsonProperty("nest_id")
    private Long nestId;

    @Schema(description = "Human-readable summary of the execution", example = "Nest created successfully")
    private String message;
}
