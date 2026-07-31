package com.neighbornest.nest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for a single expense share.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A single member's share of an expense")
public class ExpenseSplitResponse {

    @Schema(description = "User profile ID owing this share", example = "7")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Amount this user owes", example = "25.00")
    @JsonProperty("amount_owed")
    private BigDecimal amountOwed;

    @Schema(description = "Whether this share has been settled", example = "false")
    private boolean settled;
}
