package com.neighbornest.nest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.nest.entity.NestMemberStatus;
import com.neighbornest.nest.entity.NestRole;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a single Nest member.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A member of a Nest")
public class NestMemberResponse {

    @Schema(description = "User profile ID of the member", example = "7")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Full name of the member (from user-service)", example = "Jane Doe")
    @JsonProperty("full_name")
    private String fullName;

    @Schema(description = "Role the member holds in the Nest", example = "MEMBER")
    @JsonProperty("role_in_nest")
    private NestRole roleInNest;

    @Schema(description = "Membership status", example = "ACCEPTED")
    private NestMemberStatus status;

    @Schema(description = "Timestamp when the member joined", example = "2025-02-01T10:30:00")
    @JsonProperty("joined_at")
    private LocalDateTime joinedAt;

    @Schema(description = "Whether the member has graduated", example = "false")
    private boolean graduated;
}
