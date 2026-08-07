package com.neighbornest.chatservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a downstream service (nest-service) that chat-service
 * depends on for authorization is unreachable.
 * <p>
 * Maps to HTTP 503 SERVICE UNAVAILABLE status. Chat operations fail closed
 * when membership cannot be verified.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class ServiceUnavailableException extends RuntimeException {

    /**
     * Constructs a new service-unavailable exception.
     *
     * @param message the detail message
     */
    public ServiceUnavailableException(final String message) {
        super(message);
    }
}
