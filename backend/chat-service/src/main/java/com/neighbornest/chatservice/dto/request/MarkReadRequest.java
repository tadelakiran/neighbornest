package com.neighbornest.chatservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body for marking a list of messages as read by the current user.
 * <p>
 * Used by both the REST endpoint {@code POST /api/chat/messages/read} and the
 * STOMP destination {@code /app/chat/read}.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to mark messages as read")
public class MarkReadRequest {

    @NotEmpty(message = "messageIds must not be empty")
    @Schema(description = "Ids of the messages to mark as read", example = "[101, 102]")
    private List<@NotNull(message = "messageId must not be null") Long> messageIds;
}
