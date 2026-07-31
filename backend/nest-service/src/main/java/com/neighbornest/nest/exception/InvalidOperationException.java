package com.neighbornest.nest.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when an operation is invalid for the current Nest state
 * (e.g. graduating an already disbanded Nest).
 * <p>
 * Maps to HTTP 409 CONFLICT status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class InvalidOperationException extends RuntimeException {

    /**
     * Constructs a new exception with the specified detail message.
     *
     * @param message the detail message explaining the invalid operation
     */
    public InvalidOperationException(final String message) {
        super(message);
    }
}
