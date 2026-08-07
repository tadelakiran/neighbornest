package com.neighbornest.chatservice.dto.request;

import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.enums.MessageType;
import com.neighbornest.chatservice.enums.RoomType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload sent by clients to the STOMP {@code /app/chat/...} destinations when
 * sending a chat message.
 * <p>
 * {@code nestId} must be set for {@code NEST_GROUP} messages and
 * {@code conversationId} for {@code DIRECT} messages. The authoritative room id
 * also appears in the destination path; the service reconciles the two.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "WebSocket payload for sending a chat message")
public class ChatMessagePayload {

    @NotNull
    @Schema(description = "Room type the message targets", example = "NEST_GROUP")
    private RoomType roomType;

    @Schema(description = "Nest id for group messages", example = "3")
    private Long nestId;

    @Schema(description = "Conversation id for direct messages", example = "5")
    private Long conversationId;

    @NotBlank
    @Size(max = AppConstants.MAX_MESSAGE_LENGTH, message = "Message content must not exceed " + AppConstants.MAX_MESSAGE_LENGTH + " characters")
    @Schema(description = "Plain-text message content (HTML is stripped server-side)", example = "Coffee at Blue Bottle this Saturday?")
    private String content;

    @Schema(description = "Content type, defaults to TEXT", example = "TEXT")
    private MessageType messageType;
}
