package com.neighbornest.matching.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a downstream service cannot be reached.
 * <p>
 * Maps to HTTP 503 SERVICE UNAVAILABLE status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class ServiceUnavailableException extends RuntimeException {

    /**
     * Constructs a new exception with the specified detail message.
     *
     * @param message the detail message explaining the outage
     */
    public ServiceUnavailableException(final String message) {
        super(message);
    }
}
