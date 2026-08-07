package com.neighbornest.notificationservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a request is semantically invalid (duplicate template
 * key, invalid input).
 * <p>
 * Maps to HTTP 400 BAD REQUEST status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends RuntimeException {

    /**
     * Constructs a new exception with the specified detail message.
     *
     * @param message the detail message explaining the invalid request
     */
    public BadRequestException(final String message) {
        super(message);
    }
}
