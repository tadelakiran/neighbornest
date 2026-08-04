package com.neighbornest.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned by {@code GET /api/auth/validate}.
 * <p>
 * Consumed by the user-service Feign client to confirm token ownership during
 * profile creation. Field names (including {@code user_id}) match the
 * user-service {@code AuthValidationResponse} wire contract exactly.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Token validation result returned by the auth-service")
public class AuthValidationResponse {

    @Schema(description = "Whether the token is valid and unexpired", example = "true")
    private boolean valid;

    @Schema(description = "User ID the token belongs to", example = "42")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Email of the token owner", example = "john.doe@example.com")
    private String email;

    @Schema(description = "Role claim inside the token", example = "NEWCOMER")
    private String role;

    @Schema(description = "Whether the user has completed onboarding", example = "false")
    @JsonProperty("is_onboarded")
    private Boolean onboarded;
}
