package com.neighbornest.notificationservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for creating an admin-managed email template.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Admin request to create an email template")
public class CreateTemplateRequest {

    @NotBlank(message = "templateKey is required")
    @Size(max = 50, message = "templateKey must not exceed 50 characters")
    @Schema(description = "Unique template key, e.g. nest-welcome", example = "nest-welcome")
    private String templateKey;

    @NotBlank(message = "subject is required")
    @Size(max = 200, message = "subject must not exceed 200 characters")
    @Schema(description = "Email subject line", example = "Welcome to {nestName}!")
    private String subject;

    @NotBlank(message = "bodyHtml is required")
    @Schema(description = "HTML body (Thymeleaf syntax)")
    private String bodyHtml;

    @NotBlank(message = "bodyText is required")
    @Schema(description = "Plain-text fallback body ({{var}} placeholders supported)")
    private String bodyText;

    @Schema(description = "Optional JSON schema of the expected variables")
    private String variables;
}
