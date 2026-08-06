package com.neighbornest.matching.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.matching.entity.ProposalStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a Nest formation proposal including its members.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Nest formation proposal data")
public class MatchProposalResponse {

    @Schema(description = "Proposal ID", example = "12")
    private Long id;

    @Schema(description = "Proposal status", example = "PENDING")
    private ProposalStatus status;

    @Schema(description = "Timestamp when the proposal was created", example = "2025-01-15T10:30:00")
    @JsonProperty("proposed_at")
    private LocalDateTime proposedAt;

    @Schema(description = "Timestamp when the proposal expires", example = "2025-01-18T10:30:00")
    @JsonProperty("expires_at")
    private LocalDateTime expiresAt;

    @Schema(description = "Timestamp when the proposal was fully accepted", example = "2025-01-16T10:30:00")
    @JsonProperty("accepted_at")
    private LocalDateTime acceptedAt;

    @Schema(description = "ID of the Nest created after execution", example = "5")
    @JsonProperty("nest_id")
    private Long nestId;

    @Schema(description = "Members of the proposal")
    private List<ProposalMemberResponse> members;
}
