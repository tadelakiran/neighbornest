package com.neighbornest.chatservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.chatservice.enums.RoomType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO broadcast to the other participants of a room after the viewer
 * marks a set of messages as read, so clients can update read states in real
 * time.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Read-status update broadcast after messages are marked read")
public class ReadReceiptUpdateResponse {

    @Schema(description = "Profile id of the user who marked the messages read", example = "7")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Ids of the messages that were marked read", example = "[101, 102]")
    @JsonProperty("message_ids")
    private List<Long> messageIds;

    @Schema(description = "Room type the messages belong to", example = "NEST_GROUP")
    @JsonProperty("room_type")
    private RoomType roomType;

    @Schema(description = "Nest id when the room is a group chat", example = "3")
    @JsonProperty("nest_id")
    private Long nestId;

    @Schema(description = "Conversation id when the room is a direct message", example = "5")
    @JsonProperty("conversation_id")
    private Long conversationId;
}
