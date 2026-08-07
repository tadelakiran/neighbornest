package com.neighbornest.notificationservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO with notification totals for the current user.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Notification totals for a user")
public class NotificationCountResponse {

    @Schema(description = "Total number of notifications", example = "12")
    private long total;

    @Schema(description = "Number of unread notifications", example = "4")
    private long unread;

    @Schema(description = "Number of read notifications", example = "8")
    private long read;
}
