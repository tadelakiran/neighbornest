package com.neighbornest.notificationservice.dto.request;

import com.neighbornest.notificationservice.enums.OtpPurpose;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for redeeming a one-time passcode.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to verify a one-time passcode")
public class VerifyOtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    @Schema(description = "Recipient email address", example = "jane.doe@example.com",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @NotNull(message = "Purpose is required")
    @Schema(description = "Why the code was issued",
            example = "EMAIL_VERIFICATION",
            allowableValues = {"EMAIL_VERIFICATION", "PASSWORD_RESET"},
            requiredMode = Schema.RequiredMode.REQUIRED)
    private OtpPurpose purpose;

    @NotBlank(message = "Verification code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Verification code must be exactly 6 digits")
    @Schema(description = "The 6-digit code emailed to the recipient", example = "482913",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String otp;
}
