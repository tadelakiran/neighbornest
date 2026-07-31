package com.neighbornest.user.client;

import com.neighbornest.user.dto.response.AuthValidationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Feign client for communicating with the auth-service.
 * <p>
 * Used to confirm token ownership with the auth-service when required.
 * Falls back to a 503 response via {@link AuthServiceClientFallbackFactory}
 * when the auth-service is unavailable.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@FeignClient(name = "auth-service", fallbackFactory = AuthServiceClientFallbackFactory.class)
public interface AuthServiceClient {

    /**
     * Validates a JWT token with the auth-service.
     *
     * @param token the JWT token to validate
     * @return the validation result containing the user ID and role
     */
    @GetMapping("/api/auth/validate")
    ResponseEntity<AuthValidationResponse> validateToken(@RequestParam("token") String token);
}
