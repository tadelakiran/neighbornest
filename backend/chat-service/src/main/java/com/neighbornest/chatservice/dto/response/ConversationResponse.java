package com.neighbornest.chatservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a direct-message conversation as seen by a specific viewer.
 * <p>
 * {@code participant*} fields describe the <em>other</em> participant (never
 * the viewer themselves) and the conversation is enriched with its last
 * message and the viewer's unread count.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A direct-message conversation with preview and unread count")
public class ConversationResponse {

    @Schema(description = "Conversation id", example = "5")
    private Long id;

    @Schema(description = "Profile id of the other participant", example = "12")
    @JsonProperty("participant_id")
    private Long participantId;

    @Schema(description = "Display name of the other participant", example = "John Doe")
    @JsonProperty("participant_name")
    private String participantName;

    @Schema(description = "Profile photo URL of the other participant")
    @JsonProperty("participant_photo_url")
    private String participantPhotoUrl;

    @Schema(description = "Content of the last message in the conversation", example = "See you there!")
    @JsonProperty("last_message_content")
    private String lastMessageContent;

    @Schema(description = "Timestamp of the last message", example = "2025-01-15T10:30:00")
    @JsonProperty("last_message_at")
    private LocalDateTime lastMessageAt;

    @Schema(description = "Number of unread messages for the viewer", example = "3")
    @JsonProperty("unread_count")
    private long unreadCount;
}
