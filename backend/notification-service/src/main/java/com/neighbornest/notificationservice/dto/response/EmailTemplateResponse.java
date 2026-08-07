package com.neighbornest.notificationservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for an admin-managed email template.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "An admin-managed email template")
public class EmailTemplateResponse {

    @Schema(description = "Template id", example = "1")
    private Long id;

    @Schema(description = "Unique template key", example = "nest-welcome")
    @JsonProperty("template_key")
    private String templateKey;

    @Schema(description = "Email subject line", example = "Welcome to {nestName}!")
    private String subject;

    @Schema(description = "Optional JSON schema of the expected variables")
    private String variables;

    @Schema(description = "Timestamp when the template was created", example = "2025-01-15T10:30:00")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
