package com.neighbornest.auth.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Utility class for validating password strength.
 * <p>
 * Provides a reusable method for checking that a password meets
 * the required security criteria: minimum length, uppercase,
 * lowercase, digit, and special character.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@Slf4j
public final class PasswordValidator {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("\\d");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]");

    /**
     * Validates the password against the platform's security rules.
     *
     * @param password the password to validate
     * @return a list of validation error messages; empty list if the password is valid
     */
    public static List<String> validate(final String password) {
        final List<String> errors = new ArrayList<>();

        if (password == null) {
            errors.add("Password must not be null");
            return errors;
        }

        if (password.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters long");
        }
        if (password.length() > MAX_LENGTH) {
            errors.add("Password must not exceed " + MAX_LENGTH + " characters");
        }
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            errors.add("Password must contain at least one uppercase letter");
        }
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            errors.add("Password must contain at least one lowercase letter");
        }
        if (!DIGIT_PATTERN.matcher(password).find()) {
            errors.add("Password must contain at least one digit");
        }
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            errors.add("Password must contain at least one special character");
        }

        if (!errors.isEmpty()) {
            log.warn("Password validation failed: {}", errors);
        }

        return errors;
    }
}
