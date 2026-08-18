package com.neighbornest.matching.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.matching.entity.ProposalResponse;
import com.neighbornest.matching.entity.RoleInNest;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a single member of a proposal.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A member of a Nest formation proposal")
public class ProposalMemberResponse {

    @Schema(description = "User profile ID of the member", example = "7")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Full name of the member", example = "Jane Doe")
    @JsonProperty("full_name")
    private String fullName;

    @Schema(description = "URL to the member's profile photo", example = "https://storage.example.com/photos/user1.jpg")
    @JsonProperty("profile_photo_url")
    private String profilePhotoUrl;

    @Schema(description = "Role the member would hold in the Nest", example = "MEMBER")
    @JsonProperty("role_in_nest")
    private RoleInNest roleInNest;

    @Schema(description = "Member's response status", example = "PENDING")
    private ProposalResponse response;

    @Schema(description = "Timestamp when the member responded", example = "2025-01-16T10:30:00")
    @JsonProperty("responded_at")
    private LocalDateTime respondedAt;
}
