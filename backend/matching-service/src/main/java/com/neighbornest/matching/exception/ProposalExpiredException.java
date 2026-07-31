package com.neighbornest.matching.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a user tries to respond to an expired proposal.
 * <p>
 * Maps to HTTP 400 BAD REQUEST status.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ProposalExpiredException extends RuntimeException {

    /**
     * Constructs a new exception with the specified detail message.
     *
     * @param message the detail message explaining the expired proposal
     */
    public ProposalExpiredException(final String message) {
        super(message);
    }
}
