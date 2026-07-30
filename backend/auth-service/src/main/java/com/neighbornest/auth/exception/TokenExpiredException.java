package com.neighbornest.auth.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a refresh token has expired or is invalid.
 * <p>
 * Maps to HTTP 401 UNAUTHORIZED status. Indicates that the client
 * needs to re-authenticate to obtain a new refresh token.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class TokenExpiredException extends RuntimeException {

    /**
     * Constructs a new exception with the specified detail message.
     *
     * @param message the detail message explaining the token issue
     */
    public TokenExpiredException(final String message) {
        super(message);
    }
}
