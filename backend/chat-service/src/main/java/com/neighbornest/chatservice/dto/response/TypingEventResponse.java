package com.neighbornest.chatservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO broadcast to other room participants when a user starts or
 * stops typing.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Typing indicator event broadcast to room participants")
public class TypingEventResponse {

    @Schema(description = "Profile id of the user who is typing", example = "7")
    @JsonProperty("sender_id")
    private Long senderId;

    @Schema(description = "Display name of the user who is typing", example = "Jane Doe")
    @JsonProperty("sender_name")
    private String senderName;

    @Schema(description = "Whether the user started (true) or stopped (false) typing", example = "true")
    @JsonProperty("is_typing")
    private boolean typing;
}
