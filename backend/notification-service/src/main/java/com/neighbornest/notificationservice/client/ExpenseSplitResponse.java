package com.neighbornest.notificationservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * External DTO mirroring the nest-service {@code ExpenseSplitResponse} payload.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSplitResponse {

    /** User profile id owing this share. */
    @JsonProperty("user_id")
    private Long userId;

    /** Amount this user owes. */
    @JsonProperty("amount_owed")
    private BigDecimal amountOwed;

    /** Whether this share has been settled. */
    private boolean settled;
}
