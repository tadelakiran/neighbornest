package com.neighbornest.chatservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a requested resource (message, conversation, nest)
 * does not exist.
 * <p>
 * Maps to HTTP 404 NOT FOUND status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Constructs a new exception with the specified detail message.
     *
     * @param message the detail message explaining the missing resource
     */
    public ResourceNotFoundException(final String message) {
        super(message);
    }
}
