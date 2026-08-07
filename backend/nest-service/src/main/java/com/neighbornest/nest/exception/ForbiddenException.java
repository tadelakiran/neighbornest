package com.neighbornest.nest.exception;

/**
 * Thrown when an authenticated user attempts an operation they are not
 * permitted to perform (e.g. acting on a Nest they do not belong to, or a
 * non-anchor attempting an anchor-only action).
 * <p>
 * Mapped to {@code 403 FORBIDDEN} by the global exception handler.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
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
