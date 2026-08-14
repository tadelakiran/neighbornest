package com.neighbornest.auth.enums;

/**
 * Why a one-time passcode is being requested.
 * <p>
 * Values are serialized by name and must stay in sync with the
 * notification-service {@code OtpPurpose} enum they are sent to.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum OtpPurpose {
    /** Proof of email ownership during registration. */
    EMAIL_VERIFICATION,

    /** Proof of email ownership before a password reset. */
    PASSWORD_RESET
}
