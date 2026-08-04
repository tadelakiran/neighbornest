package com.neighbornest.gateway.exception;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.netty.channel.ConnectTimeoutException;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;

/**
 * Global error handler for the API Gateway.
 * <p>
 * Catches exceptions thrown during request routing and returns
 * standardized JSON error responses with appropriate HTTP status codes.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Order(-1)
@Configuration
public class GlobalErrorHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper;

    /**
     * Constructs the global error handler with a configured {@link ObjectMapper}.
     */
    public GlobalErrorHandler() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Handles uncaught exceptions in the gateway's reactive pipeline.
     *
     * @param exchange the current server exchange
     * @param ex       the exception that was thrown
     * @return a {@link Mono} that completes with the error response
     */
    @Override
    public Mono<Void> handle(final ServerWebExchange exchange, final Throwable ex) {
        final HttpStatus status = determineHttpStatus(ex);

        final Map<String, Object> errorBody = new LinkedHashMap<>();
        errorBody.put("timestamp", Instant.now().toString());
        errorBody.put("status", status.value());
        errorBody.put("error", status.getReasonPhrase());
        // Never echo raw exception internals for 5xx responses — they can leak
        // class names, SQL fragments, or dependency details to clients. Known
        // client-facing statuses keep their precise reason; 500s get a generic
        // message while the full stack trace goes to the gateway logs instead.
        final String detail = ex.getMessage();
        errorBody.put("message", status.is5xxServerError()
                ? "Unexpected server error. Please try again later."
                : detail != null ? detail : status.getReasonPhrase());
        errorBody.put("path", exchange.getRequest().getURI().getPath());
        errorBody.put("service", "api-gateway");

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        final byte[] body = serializeErrorBody(errorBody, status);

        return exchange.getResponse()
                .writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(body)));
    }

    /**
     * Serializes the error body map to JSON bytes.
     *
     * @param errorBody the error details map
     * @param status    the HTTP status for fallback
     * @return a byte array containing JSON
     */
    private byte[] serializeErrorBody(final Map<String, Object> errorBody, final HttpStatus status) {
        try {
            return objectMapper.writeValueAsBytes(errorBody);
        } catch (final JsonProcessingException e) {
            final String fallback = "{\"status\":" + status.value()
                    + ",\"error\":\"" + status.getReasonPhrase() + "\"}";
            return fallback.getBytes();
        }
    }

    /**
     * Determines the appropriate HTTP status code based on the exception type.
     *
     * @param ex the exception to evaluate
     * @return the corresponding {@link HttpStatus}
     */
    private HttpStatus determineHttpStatus(final Throwable ex) {
        if (ex instanceof final ResponseStatusException responseStatusException) {
            return HttpStatus.resolve(responseStatusException.getStatusCode().value());
        }
        // No route matched the request path — genuinely 404, not 503.
        if (ex instanceof NotFoundException) {
            return HttpStatus.NOT_FOUND;
        }
        // Downstream connectivity/timeout issues surface as 503 so clients can
        // distinguish "service unavailable" from "internal bug".
        if (ex instanceof ConnectException
                || ex instanceof ConnectTimeoutException
                || ex instanceof SocketTimeoutException
                || ex instanceof TimeoutException) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
