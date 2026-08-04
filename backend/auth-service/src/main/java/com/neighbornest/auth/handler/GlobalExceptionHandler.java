package com.neighbornest.auth.handler;

import com.neighbornest.auth.dto.response.ErrorResponse;
import com.neighbornest.auth.exception.BadRequestException;
import com.neighbornest.auth.exception.InvalidCredentialsException;
import com.neighbornest.auth.exception.ResourceNotFoundException;
import com.neighbornest.auth.exception.TokenExpiredException;
import com.neighbornest.auth.exception.UserAlreadyExistsException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the Auth Service.
 * <p>
 * Catches all exceptions thrown by controllers and returns
 * standardized {@link ErrorResponse} objects with appropriate
 * HTTP status codes and messages.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handles {@link UserAlreadyExistsException} — returns 409 CONFLICT.
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUserAlreadyExists(
            final UserAlreadyExistsException ex, final HttpServletRequest request) {
        log.warn("Conflict error: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    /**
     * Handles {@link DataIntegrityViolationException} — returns 409 CONFLICT.
     * <p>
     * Two concurrent registrations can both pass the {@code existsByEmail} guard
     * and then collide on the unique email constraint; the DB constraint is the
     * final arbiter and must surface as a 409 ("already registered") rather than
     * a raw 500. The client retries/registers without being told the account
     * actually exists.
     * </p>
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            final DataIntegrityViolationException ex, final HttpServletRequest request) {
        final Throwable root = ex.getMostSpecificCause();
        // Only a duplicate-key violation (concurrent registrations racing the
        // unique email constraint) is a "conflict" the client can act on.
        if (root instanceof final java.sql.SQLIntegrityConstraintViolationException constraintViolation
                && constraintViolation.getMessage() != null
                && constraintViolation.getMessage().toLowerCase().contains("duplicate")) {
            log.warn("Duplicate email registration: {}", root.getMessage());
            return buildErrorResponse(HttpStatus.CONFLICT,
                    "This email is already registered. Try signing in instead.", request);
        }
        log.error("Data integrity violation: {}", ex.getMessage(), ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.", request);
    }

    /**
     * Handles {@link InvalidCredentialsException} — returns 401 UNAUTHORIZED.
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
            final InvalidCredentialsException ex, final HttpServletRequest request) {
        log.warn("Unauthorized: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    /**
     * Handles {@link TokenExpiredException} — returns 401 UNAUTHORIZED.
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<ErrorResponse> handleTokenExpired(
            final TokenExpiredException ex, final HttpServletRequest request) {
        log.warn("Token expired: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    /**
     * Handles {@link ResourceNotFoundException} — returns 404 NOT FOUND.
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            final ResourceNotFoundException ex, final HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    /**
     * Handles {@link BadRequestException} — returns 400 BAD REQUEST.
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(
            final BadRequestException ex, final HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * Handles {@link MethodArgumentNotValidException} — returns 400 BAD REQUEST
     * with field-level validation errors.
     *
     * @param ex      the validation exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with field-level error details
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
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            final IllegalArgumentException ex, final HttpServletRequest request) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * Handles {@link AuthenticationException} (Spring Security) — returns 401 UNAUTHORIZED.
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            final AuthenticationException ex, final HttpServletRequest request) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Authentication failed: " + ex.getMessage(), request);
    }

    /**
     * Handles {@link AccessDeniedException} — returns 403 FORBIDDEN.
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            final AccessDeniedException ex, final HttpServletRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Access denied: " + ex.getMessage(), request);
    }

    /**
     * Handles {@link AccountStatusException} — returns 401 UNAUTHORIZED.
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
     */
    @ExceptionHandler(AccountStatusException.class)
    public ResponseEntity<ErrorResponse> handleAccountStatus(
            final AccountStatusException ex, final HttpServletRequest request) {
        log.warn("Account status error: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Account status error: " + ex.getMessage(), request);
    }

    /**
     * Handles any unhandled exception — returns 500 INTERNAL SERVER ERROR.
     *
     * @param ex      the exception instance
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with error details
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
     *
     * @param status  the HTTP status
     * @param message the error message
     * @param request the current HTTP request
     * @return a {@link ResponseEntity} with the constructed {@link ErrorResponse}
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
