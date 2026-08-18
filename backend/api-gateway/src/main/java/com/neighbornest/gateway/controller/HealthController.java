package com.neighbornest.gateway.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Dedicated health/keep-alive endpoint for the API Gateway.
 * <p>
 * Serves {@code GET /health} — a tiny, always-200 probe meant for external
 * uptime/monitoring services and the optional frontend keep-alive. It is
 * intentionally isolated from the rest of the application:
 * </p>
 * <ul>
 *     <li>No database / MySQL access.</li>
 *     <li>No RabbitMQ access.</li>
 *     <li>No calls to other microservices (Eureka, Feign, etc.).</li>
 *     <li>No authentication / authorization logic.</li>
 *     <li>No application state is read or modified.</li>
 *     <li>No per-request logging — the endpoint is silent.</li>
 * </ul>
 * <p>
 * The handler only reports that the gateway process itself is up and accepting
 * requests. For infrastructure-level checks (Docker healthchecks, deploy.sh)
 * the existing Spring Boot Actuator endpoint at {@code /actuator/health}
 * remains untouched and continues to be used.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
public class HealthController {

    /**
     * Lightweight liveness probe.
     *
     * @return a minimal {@code {"status":"UP"}} JSON body with HTTP 200
     */
    @GetMapping(value = "/health", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Map<String, String>> health() {
        return Mono.just(Map.of("status", "UP"));
    }
}
