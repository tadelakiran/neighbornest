package com.neighbornest.auth.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when attempting to register a user with an email
 * that is already registered on the platform.
 * <p>
 * Maps to HTTP 409 CONFLICT status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class UserAlreadyExistsException extends RuntimeException {

    /**
     * Constructs a new exception with the specified detail message.
     *
     * @param message the detail message explaining the conflict
     */
    public UserAlreadyExistsException(final String message) {
        super(message);
    }
}
