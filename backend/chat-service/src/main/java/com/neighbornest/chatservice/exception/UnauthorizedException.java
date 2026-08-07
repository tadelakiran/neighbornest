package com.neighbornest.chatservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a request or WebSocket frame is missing or carries an
 * invalid authentication credential.
 * <p>
 * Maps to HTTP 401 UNAUTHORIZED status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class UnauthorizedException extends RuntimeException {

    /**
     * Constructs a new unauthorized exception.
     *
     * @param message the detail message
     */
    public UnauthorizedException(final String message) {
        super(message);
    }
}
