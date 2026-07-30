package com.neighbornest.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for user logout.
 * <p>
 * Optionally contains the refresh token to be invalidated upon logout.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for logging out (optionally invalidating a refresh token)")
public class LogoutRequest {

    @Schema(description = "The refresh token to invalidate (optional)", example = "550e8400-e29b-41d4-a716-446655440000")
    private String refreshToken;
}
