package com.neighbornest.chatservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when an authenticated user attempts an operation they are
 * not permitted to perform (e.g. sending to a Nest they do not belong to, or
 * starting a DM with someone they never shared a Nest with).
 * <p>
 * Maps to HTTP 403 FORBIDDEN status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {

    /**
     * Constructs a new forbidden exception.
     *
     * @param message the detail message
     */
    public ForbiddenException(final String message) {
        super(message);
    }
}
