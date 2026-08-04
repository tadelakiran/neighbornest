package com.neighbornest.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Fallback endpoints for the gateway's circuit breakers.
 * <p>
 * When a downstream service trips its circuit breaker or is unreachable, the
 * gateway forwards to {@code /fallback/<service>}. These handlers return a
 * clean, consistent 503 JSON body so clients never see raw router exceptions
 * or 404s for the fallback path itself.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.1.0
 */
@RestController
public class FallbackController {

    /**
     * Generic fallback for any routed service.
     *
     * @param service the failing service name (auth, user, matching, nest)
     * @return a 503 SERVICE UNAVAILABLE JSON body
     */
    @GetMapping(value = "/fallback/{service}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> fallback(@PathVariable final String service) {
        final Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        body.put("error", HttpStatus.SERVICE_UNAVAILABLE.getReasonPhrase());
        body.put("message", capitalize(service) + "-service is temporarily unavailable. Please try again in a moment.");
        body.put("service", "api-gateway");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }

    /**
     * Capitalizes the first letter of a service name for a friendly message.
     *
     * @param value the raw service name, e.g. "auth"
     * @return the capitalized name, e.g. "Auth"
     */
    private String capitalize(final String value) {
        if (value == null || value.isEmpty()) return value;
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
