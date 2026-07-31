package com.neighbornest.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned by the auth-service when validating a token.
 * <p>
 * Used by the user-service Feign client to confirm token ownership with
 * the auth-service when required.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Token validation result from the auth-service")
public class AuthValidationResponse {

    @Schema(description = "Whether the token is valid", example = "true")
    private boolean valid;

    @Schema(description = "User ID the token belongs to", example = "42")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Email of the token owner", example = "john.doe@example.com")
    private String email;

    @Schema(description = "Role claim inside the token", example = "NEWCOMER")
    private String role;
}
