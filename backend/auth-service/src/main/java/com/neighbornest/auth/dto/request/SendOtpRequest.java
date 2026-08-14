package com.neighbornest.auth.dto.request;

import com.neighbornest.auth.enums.OtpPurpose;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for emailing a one-time passcode.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to email a one-time passcode (registration verification)")
public class SendOtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    @Schema(description = "Recipient email address", example = "jane.doe@example.com",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @NotNull(message = "Purpose is required")
    @Schema(description = "Why the code is being issued", example = "EMAIL_VERIFICATION",
            allowableValues = {"EMAIL_VERIFICATION", "PASSWORD_RESET"},
            requiredMode = Schema.RequiredMode.REQUIRED)
    private OtpPurpose purpose;
}
