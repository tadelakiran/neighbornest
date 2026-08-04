package com.neighbornest.user.handler;

import com.neighbornest.user.dto.response.ErrorResponse;
import com.neighbornest.user.exception.BadRequestException;
import com.neighbornest.user.exception.DuplicateProfileException;
import com.neighbornest.user.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the User Service.
 * <p>
 * Converts thrown exceptions into standardized {@link ErrorResponse} bodies
 * with appropriate HTTP status codes.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handles {@link ResourceNotFoundException} — returns 404 NOT FOUND.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            final ResourceNotFoundException ex, final HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    /**
     * Handles {@link BadRequestException} — returns 400 BAD REQUEST.
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(
            final BadRequestException ex, final HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * Handles {@link DuplicateProfileException} — returns 409 CONFLICT.
     */
    @ExceptionHandler(DuplicateProfileException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateProfile(
            final DuplicateProfileException ex, final HttpServletRequest request) {
        log.warn("Conflict: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    /**
     * Handles {@link DataIntegrityViolationException} — returns 409 CONFLICT.
     * <p>
     * The {@code auth_user_id} column is unique; two concurrent profile-creation
     * requests can both pass {@code existsByAuthUserId} and then collide on the
     * DB constraint. That must surface as a clean 409, not a raw 500.
     * </p>
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            final DataIntegrityViolationException ex, final HttpServletRequest request) {
        final Throwable root = ex.getMostSpecificCause();
        // Only a duplicate-key violation (two profile creations racing the
        // unique auth_user_id constraint) is a recoverable 409 for the client.
        if (root instanceof final java.sql.SQLIntegrityConstraintViolationException constraintViolation
                && constraintViolation.getMessage() != null
                && constraintViolation.getMessage().toLowerCase().contains("duplicate")) {
            log.warn("Duplicate profile creation: {}", root.getMessage());
            return buildErrorResponse(HttpStatus.CONFLICT,
                    "This profile already exists. Refresh to load your current profile.", request);
        }
        log.error("Data integrity violation: {}", ex.getMessage(), ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.", request);
    }

    /**
     * Handles {@link MethodArgumentNotValidException} — returns 400 with field errors.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            final MethodArgumentNotValidException ex, final HttpServletRequest request) {

        final Map<String, String> validationErrors = new HashMap<>();
        for (final FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            validationErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        log.warn("Validation failed: {}", validationErrors);

        final ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Validation failed. Check validationErrors for details.")
                .path(request.getRequestURI())
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * Handles {@link IllegalArgumentException} — returns 400 BAD REQUEST.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            final IllegalArgumentException ex, final HttpServletRequest request) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * Handles {@link AuthenticationException} — returns 401 UNAUTHORIZED.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            final AuthenticationException ex, final HttpServletRequest request) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Authentication failed: " + ex.getMessage(), request);
    }

    /**
     * Handles {@link AccessDeniedException} — returns 403 FORBIDDEN.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            final AccessDeniedException ex, final HttpServletRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Access denied: " + ex.getMessage(), request);
    }

    /**
     * Handles any unhandled exception — returns 500 INTERNAL SERVER ERROR.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
            final Exception ex, final HttpServletRequest request) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.", request);
    }

    /**
     * Builds a standardized error response.
     */
    private ResponseEntity<ErrorResponse> buildErrorResponse(
            final HttpStatus status, final String message, final HttpServletRequest request) {

        final ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(status).body(errorResponse);
    }
}
