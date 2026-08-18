package com.neighbornest.chatservice.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Consistent success envelope returned by every frontend-facing endpoint.
 * <p>
 * All successful responses share the shape {@code { data, message, status }}
 * so clients can handle any endpoint uniformly. Feign-internal endpoints are
 * intentionally excluded by {@link com.neighbornest.chatservice.config.ApiResponseAdvice}
 * so inter-service calls keep receiving the raw payload.
 * </p>
 *
 * @param data    the actual payload (may be a list, page, DTO, count, ...)
 * @param message a human-readable success message (HTTP reason phrase)
 * @param status  the HTTP status code
 * @param <T>     the payload type
 * @author NeighborNest Team
 * @version 1.0.0
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standardized success response envelope")
public record ApiResponse<T>(T data, String message, int status) {

    /**
     * Builds a success envelope.
     *
     * @param data    the payload
     * @param message the success message
     * @param status  the HTTP status code
     * @param <T>     the payload type
     * @return the envelope
     */
    public static <T> ApiResponse<T> ok(final T data, final String message, final int status) {
        return new ApiResponse<>(data, message, status);
    }
}
