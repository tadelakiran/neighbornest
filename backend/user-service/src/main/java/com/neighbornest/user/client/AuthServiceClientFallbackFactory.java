package com.neighbornest.user.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

/**
 * Fallback factory for {@link AuthServiceClient}.
 * <p>
 * Invoked when the auth-service is unreachable. Returns a 503 SERVICE
 * UNAVAILABLE response so downstream callers can degrade gracefully.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@Slf4j
public class AuthServiceClientFallbackFactory implements FallbackFactory<AuthServiceClient> {

    /**
     * Creates a fallback implementation that reports the auth-service outage.
     *
     * @param cause the underlying cause of the failure
     * @return a fallback {@link AuthServiceClient} instance
     */
    @Override
    public AuthServiceClient create(final Throwable cause) {
        log.warn("Auth-service is unavailable, returning 503 fallback. Cause: {}", cause.getMessage());
        return token -> ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(null);
    }
}
