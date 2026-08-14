package com.neighbornest.notificationservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response returned after a code is redeemed.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Result of verifying a one-time passcode")
public class OtpVerifyResponse {

    /** Whether the code was valid and is now consumed. */
    @Schema(example = "true")
    private boolean valid;
}
