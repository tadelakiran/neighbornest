package com.neighbornest.matching.config;

import com.neighbornest.matching.dto.response.ApiResponse;
import com.neighbornest.matching.dto.response.ErrorResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.util.List;

/**
 * Wraps every successful JSON response in the consistent
 * {@code { data, message, status }} envelope.
 * <p>
 * No other service calls the matching-service over Feign, so every REST
 * endpoint is frontend-facing and gets wrapped. Error bodies produced by the
 * {@link com.neighbornest.matching.handler.GlobalExceptionHandler} already
 * carry {@code status}/{@code message}, so they are passed through unchanged.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestControllerAdvice
public class ApiResponseAdvice implements ResponseBodyAdvice<Object> {

    /** Non-API paths (actuator health, OpenAPI docs) stay unwrapped. */
    private static final List<String> NON_API_PATH_PREFIXES = List.of(
            "/actuator",
            "/v3/api-docs",
            "/swagger-ui"
    );

    /**
     * Only wrap handlers that produce JSON through Jackson.
     *
     * @param returnType    the handler return type
     * @param converterType the selected message converter
     * @return {@code true} when the body will be serialized by Jackson
     */
    @Override
    public boolean supports(final MethodParameter returnType,
                            final Class<? extends HttpMessageConverter<?>> converterType) {
        return MappingJackson2HttpMessageConverter.class.isAssignableFrom(converterType);
    }

    /**
     * Wraps a successful body in the envelope unless it is already an envelope
     * or an error body.
     *
     * @param body                  the response body
     * @param returnType            the handler return type
     * @param selectedContentType   the selected content type
     * @param selectedConverterType the selected converter
     * @param request               the server request
     * @param response              the server response
     * @return the body to serialize
     */
    @Override
    public Object beforeBodyWrite(final Object body, final MethodParameter returnType,
                                  final MediaType selectedContentType,
                                  final Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  final ServerHttpRequest request, final ServerHttpResponse response) {
        if (body == null || body instanceof ApiResponse || body instanceof ErrorResponse) {
            return body;
        }

        final String path = request.getURI().getPath();
        if (NON_API_PATH_PREFIXES.stream().anyMatch(path::startsWith)) {
            return body;
        }

        final int status = currentStatus(response);
        final HttpStatus httpStatus = HttpStatus.resolve(status);
        final String message = httpStatus != null ? httpStatus.getReasonPhrase() : "OK";

        return ApiResponse.ok(body, message, status);
    }

    /**
     * Returns the HTTP status already applied to the response (the
     * {@code ResponseEntity} status is set before the body is written).
     *
     * @param response the server response
     * @return the applied status code, or 200 when unknown
     */
    private int currentStatus(final ServerHttpResponse response) {
        if (response instanceof final ServletServerHttpResponse servletResponse) {
            final int status = servletResponse.getServletResponse().getStatus();
            if (status > 0) {
                return status;
            }
        }
        return HttpStatus.OK.value();
    }
}
