package com.neighbornest.notificationservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response DTO with admin notification statistics.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Admin notification statistics")
public class NotificationStatsResponse {

    @Schema(description = "Notifications created today", example = "42")
    @JsonProperty("total_sent_today")
    private long totalSentToday;

    @Schema(description = "Failed dispatches today", example = "2")
    @JsonProperty("failed_today")
    private long failedToday;

    @Schema(description = "Count of notifications by type (today)")
    @JsonProperty("by_type")
    private Map<String, Long> byType;

    @Schema(description = "Count of notifications by channel (today)")
    @JsonProperty("by_channel")
    private Map<String, Long> byChannel;
}
