package com.neighbornest.nest.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for a custom expense split entry.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A custom split entry for an expense")
public class ExpenseSplitRequest {

    @NotNull(message = "User ID is required")
    @Schema(description = "User profile ID owing this share", example = "7", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long userId;

    @NotNull(message = "Amount owed is required")
    @DecimalMin(value = "0.01", message = "Amount owed must be positive")
    @Schema(description = "Amount this user owes", example = "25.00", requiredMode = Schema.RequiredMode.REQUIRED)
    private BigDecimal amountOwed;
}
