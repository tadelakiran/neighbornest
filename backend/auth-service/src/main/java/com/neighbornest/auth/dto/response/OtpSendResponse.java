package com.neighbornest.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.auth.enums.OtpPurpose;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response returned after a code is emailed — mirrors the notification-service
 * payload. Never contains the code itself.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Result of issuing a one-time passcode")
public class OtpSendResponse {

    /** Normalized recipient address. */
    @Schema(example = "jane.doe@example.com")
    private String email;

    /** The purpose the code was issued for. */
    @Schema(example = "EMAIL_VERIFICATION")
    private OtpPurpose purpose;

    /** How long the code stays valid, in seconds. */
    @Schema(example = "600")
    @JsonProperty("expires_in_seconds")
    private long expiresInSeconds;

    /** How long the caller must wait before requesting another code, in seconds. */
    @Schema(example = "60")
    @JsonProperty("resend_after_seconds")
    private long resendAfterSeconds;
}
