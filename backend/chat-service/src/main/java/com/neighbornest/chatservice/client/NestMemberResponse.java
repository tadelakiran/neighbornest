package com.neighbornest.chatservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * External DTO mirroring the nest-service {@code NestMemberResponse} payload.
 * <p>
 * {@code status} and {@code roleInNest} are intentionally kept as strings so
 * the chat-service does not couple to nest-service enums.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NestMemberResponse {

    /** User-service profile id of the member. */
    @JsonProperty("user_id")
    private Long userId;

    /** Display name of the member (from user-service). */
    @JsonProperty("full_name")
    private String fullName;

    /** Role in the Nest (ANCHOR or MEMBER). */
    @JsonProperty("role_in_nest")
    private String roleInNest;

    /** Membership status (ACCEPTED / LEFT / REMOVED). */
    private String status;

    /** Timestamp when the member joined. */
    @JsonProperty("joined_at")
    private LocalDateTime joinedAt;

    /** Whether the member graduated. */
    private boolean graduated;
}
