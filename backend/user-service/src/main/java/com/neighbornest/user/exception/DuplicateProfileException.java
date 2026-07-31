package com.neighbornest.user.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a profile already exists for the authenticated user.
 * <p>
 * Maps to HTTP 409 CONFLICT status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateProfileException extends RuntimeException {

    /**
     * Constructs a new exception with the specified detail message.
     *
     * @param message the detail message explaining the conflict
     */
    public DuplicateProfileException(final String message) {
        super(message);
    }
}
