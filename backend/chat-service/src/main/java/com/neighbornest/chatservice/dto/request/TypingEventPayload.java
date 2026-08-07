package com.neighbornest.chatservice.dto.request;

import com.neighbornest.chatservice.enums.RoomType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload sent by clients to the STOMP typing destinations
 * ({@code /app/chat/nest/{nestId}/typing} and {@code /app/chat/dm/{conversationId}/typing}).
 * <p>
 * {@code senderId} is informational only — the server always uses the identity
 * resolved from the authenticated WebSocket session so clients cannot spoof
 * who is typing.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "WebSocket payload for typing indicators")
public class TypingEventPayload {

    @NotNull
    @Schema(description = "Room type the typing event targets", example = "NEST_GROUP")
    private RoomType roomType;

    @Schema(description = "Nest id for group typing events", example = "3")
    private Long nestId;

    @Schema(description = "Conversation id for direct-message typing events", example = "5")
    private Long conversationId;

    @Schema(description = "Sender profile id (ignored by the server; session identity is authoritative)", example = "7")
    private Long senderId;

    @NotNull
    @Schema(description = "Whether the user started or stopped typing", example = "true")
    private Boolean isTyping;
}
