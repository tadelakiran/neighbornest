package com.neighbornest.auth.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when authentication credentials are invalid.
 * <p>
 * Maps to HTTP 401 UNAUTHORIZED status. Used when the email or
 * password provided during login does not match any user record.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class InvalidCredentialsException extends RuntimeException {

    /**
     * Constructs a new exception with the specified detail message.
     *
     * @param message the detail message explaining the invalid credentials
     */
    public InvalidCredentialsException(final String message) {
        super(message);
    }
}
