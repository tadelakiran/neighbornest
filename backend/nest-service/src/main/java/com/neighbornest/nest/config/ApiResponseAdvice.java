package com.neighbornest.nest.config;

import com.neighbornest.nest.dto.response.ApiResponse;
import com.neighbornest.nest.dto.response.ErrorResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpMethod;
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
import java.util.regex.Pattern;

/**
 * Wraps every successful JSON response in the consistent
 * {@code { data, message, status }} envelope.
 * <p>
 * Feign-internal endpoints (consumed by the matching/chat/notification
 * services over the wire) are excluded so their clients keep deserializing the
 * raw payload — see {@link #isInternalPath(String)}. Error bodies produced by
 * the {@link com.neighbornest.nest.handler.GlobalExceptionHandler} already
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
     * Feign-internal endpoints — called by other services and MUST stay
     * unwrapped. Keep this list in sync with the Feign clients in the
     * matching/chat/notification services. Note the frontend also reads some
     * of these paths; its axios layer tolerates both raw and enveloped bodies.
     */
    private static final List<String> INTERNAL_PATH_PREFIXES = List.of(
            "/api/nests/my-nests"
    );

    /** Exact create/list-all path (matching-service createNest, notification list). */
    private static final Pattern INTERNAL_NESTS_ROOT = Pattern.compile("^/api/nests$");

    /** Nest detail consumed by the chat/notification services. */
    private static final Pattern INTERNAL_NEST_DETAIL = Pattern.compile("^/api/nests/\\d+$");

    /** Meeting/expense/vibe-check reads consumed by the notification scheduler
     *  (GET only — the same paths carry frontend-only POSTs like scheduling a
     *  meeting, which must be wrapped). */
    private static final Pattern INTERNAL_NEST_SUBRESOURCE = Pattern.compile(
            "^/api/nests/\\d+/(meetings|expenses|vibe-check/status)$");

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
     * Wraps a successful body in the envelope unless it is already an envelope,
     * an error body, or served from a Feign-internal endpoint.
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

        if (isInternalPath(request.getURI().getPath(), request.getMethod())) {
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

    /**
     * Returns whether a request path belongs to a Feign-internal endpoint.
     *
     * @param path   the request path
     * @param method the HTTP method
     * @return {@code true} when the response must stay unwrapped
     */
    private boolean isInternalPath(final String path, final HttpMethod method) {
        final boolean isGet = method == HttpMethod.GET;
        return NON_API_PATH_PREFIXES.stream().anyMatch(path::startsWith)
                || INTERNAL_PATH_PREFIXES.stream().anyMatch(path::startsWith)
                || INTERNAL_NESTS_ROOT.matcher(path).matches()
                || INTERNAL_NEST_DETAIL.matcher(path).matches()
                || (isGet && INTERNAL_NEST_SUBRESOURCE.matcher(path).matches());
    }
}
