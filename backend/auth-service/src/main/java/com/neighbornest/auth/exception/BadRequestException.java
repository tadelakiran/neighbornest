package com.neighbornest.auth.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a request contains invalid or malformed data.
 * <p>
 * Maps to HTTP 400 BAD REQUEST status. Used for validation failures
 * and other client-side input errors that do not match specific
 * exception types.
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
     * @param message the detail message explaining the bad request
     */
    public BadRequestException(final String message) {
        super(message);
    }
}
