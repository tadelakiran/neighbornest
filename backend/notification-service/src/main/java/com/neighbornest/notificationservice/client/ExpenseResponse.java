package com.neighbornest.notificationservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * External DTO mirroring the nest-service {@code ExpenseResponse} payload
 * fields the scheduler needs for settlement reminders.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseResponse {

    /** Expense id. */
    private Long id;

    /** Total expense amount. */
    private BigDecimal amount;

    /** What the expense was for. */
    private String description;

    /** Individual shares of the expense. */
    private List<ExpenseSplitResponse> splits;

    /** Timestamp when the expense was created. */
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
