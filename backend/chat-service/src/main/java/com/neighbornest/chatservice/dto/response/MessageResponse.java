package com.neighbornest.chatservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.chatservice.enums.MessageType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a single chat message, enriched with the sender's display
 * name and photo (fetched from the user-service) and the viewer's read state.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A chat message with sender details and read state")
public class MessageResponse {

    @Schema(description = "Message id", example = "101")
    private Long id;

    @Schema(description = "Sender's user-service profile id", example = "7")
    @JsonProperty("sender_id")
    private Long senderId;

    @Schema(description = "Sender's display name", example = "Jane Doe")
    @JsonProperty("sender_name")
    private String senderName;

    @Schema(description = "Sender's profile photo URL", example = "https://storage.example.com/photos/jane.jpg")
    @JsonProperty("sender_photo_url")
    private String senderPhotoUrl;

    @Schema(description = "Plain-text message content", example = "Coffee at Blue Bottle this Saturday?")
    private String content;

    @Schema(description = "Content type", example = "TEXT")
    @JsonProperty("message_type")
    private MessageType messageType;

    @Schema(description = "Timestamp when the message was created", example = "2025-01-15T10:30:00")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @Schema(description = "Whether the current viewer has read this message", example = "true")
    @JsonProperty("is_read_by_me")
    private boolean readByMe;
}
