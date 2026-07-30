package com.neighbornest.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standardized error response DTO returned by the global exception handler.
 * <p>
 * Provides a consistent error format across all API endpoints, including
 * timestamp, HTTP status, error name, descriptive message, and the
 * request path that caused the error.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standardized API error response")
public class ErrorResponse {

    @Schema(description = "Timestamp when the error occurred", example = "2025-01-15T10:30:00")
    private LocalDateTime timestamp;

    @Schema(description = "HTTP status code", example = "400")
    private int status;

    @Schema(description = "HTTP status reason phrase", example = "Bad Request")
    private String error;

    @Schema(description = "Human-readable error message", example = "Email already registered")
    private String message;

    @Schema(description = "Request path that caused the error", example = "/api/auth/register")
    private String path;

    @Schema(description = "Field-level validation errors (if applicable)", example = "{\"email\": \"Email is required\"}")
    private Map<String, String> validationErrors;
}
