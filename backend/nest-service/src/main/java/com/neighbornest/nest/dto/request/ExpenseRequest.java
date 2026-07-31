package com.neighbornest.nest.dto.request;

import com.neighbornest.nest.entity.SplitType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for creating an expense with optional custom splits.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for creating a Nest expense")
public class ExpenseRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    @Schema(description = "Total expense amount", example = "100.00", requiredMode = Schema.RequiredMode.REQUIRED)
    private BigDecimal amount;

    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Schema(description = "What the expense was for", example = "Group dinner", requiredMode = Schema.RequiredMode.REQUIRED)
    private String description;

    @NotNull(message = "Split type is required")
    @Schema(description = "How the expense is split", example = "EQUAL", requiredMode = Schema.RequiredMode.REQUIRED)
    private SplitType splitType;

    @Valid
    @Schema(description = "Custom splits (required when splitType is CUSTOM)")
    private List<ExpenseSplitRequest> splits;
}
