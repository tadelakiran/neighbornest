package com.neighbornest.notificationservice.enums;

/**
 * The business reason an OTP (one-time passcode) was issued.
 * <p>
 * {@code EMAIL_VERIFICATION} proves ownership of an email address during
 * registration; {@code PASSWORD_RESET} proves ownership before a password is
 * changed. The purpose scopes OTP storage, rate limiting, and the email
 * template used to deliver the code.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum OtpPurpose {
    /** Sent when a new account wants to prove it owns an email address. */
    EMAIL_VERIFICATION,

    /** Sent when an existing account wants to reset its password. */
    PASSWORD_RESET
}
