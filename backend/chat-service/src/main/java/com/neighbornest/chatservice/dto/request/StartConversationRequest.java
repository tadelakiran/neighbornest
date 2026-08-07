package com.neighbornest.chatservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for starting (or fetching) a direct-message conversation.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to start a direct-message conversation")
public class StartConversationRequest {

    @NotNull(message = "participantId is required")
    @Positive(message = "participantId must be a positive number")
    @Schema(description = "User-service profile id of the other participant", example = "12")
    private Long participantId;
}
