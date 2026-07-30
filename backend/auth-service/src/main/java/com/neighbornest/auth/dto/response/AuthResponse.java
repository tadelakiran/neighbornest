package com.neighbornest.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned after successful authentication.
 * <p>
 * Contains the JWT access token, refresh token, token type,
 * and expiration details for the client to use in subsequent requests.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response containing authentication tokens")
public class AuthResponse {

    @Schema(description = "JWT access token", example = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0...")
    @JsonProperty("access_token")
    private String accessToken;

    @Schema(description = "Refresh token for obtaining new access tokens", example = "550e8400-e29b-41d4-a716-446655440000")
    @JsonProperty("refresh_token")
    private String refreshToken;

    @Schema(description = "Token type", example = "Bearer")
    @Builder.Default
    @JsonProperty("token_type")
    private String tokenType = "Bearer";

    @Schema(description = "Access token expiry duration in seconds", example = "900")
    @JsonProperty("expires_in")
    private long expiresIn;
}
