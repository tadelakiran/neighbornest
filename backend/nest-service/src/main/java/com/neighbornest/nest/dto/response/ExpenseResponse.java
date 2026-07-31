package com.neighbornest.nest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.nest.entity.SplitType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a Nest expense with its splits.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A Nest expense with splits")
public class ExpenseResponse {

    @Schema(description = "Expense ID", example = "1")
    private Long id;

    @Schema(description = "User profile ID of the payer", example = "7")
    @JsonProperty("payer_id")
    private Long payerId;

    @Schema(description = "Total expense amount", example = "100.00")
    private BigDecimal amount;

    @Schema(description = "What the expense was for", example = "Group dinner")
    private String description;

    @Schema(description = "How the expense is split", example = "EQUAL")
    @JsonProperty("split_type")
    private SplitType splitType;

    @Schema(description = "Individual shares of the expense")
    private List<ExpenseSplitResponse> splits;

    @Schema(description = "Timestamp when the expense was created", example = "2025-01-15T10:30:00")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
