package com.neighbornest.chatservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned by {@code POST /api/chat/messages/read} carrying the
 * number of receipts actually created.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Result of marking messages as read")
public class MarkReadResponse {

    @Schema(description = "Number of messages newly marked as read", example = "2")
    @JsonProperty("marked_count")
    private int markedCount;
}
