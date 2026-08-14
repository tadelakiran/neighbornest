package com.neighbornest.notificationservice.service;

import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.dto.response.OtpSendResponse;
import com.neighbornest.notificationservice.dto.response.OtpVerifyResponse;
import com.neighbornest.notificationservice.entity.EmailOtp;
import com.neighbornest.notificationservice.enums.OtpPurpose;
import com.neighbornest.notificationservice.exception.BadRequestException;
import com.neighbornest.notificationservice.repository.EmailOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Issues and redeems one-time passcodes sent by email.
 * <p>
 * This is the platform's email-service entry point for the auth flows: the
 * auth-service requests a code (registration verification or password reset),
 * the user proves they own the inbox by entering it, and the auth-service
 * redeems it. Security posture:
 * <ul>
 *   <li>Codes are 6 digits from a {@link SecureRandom} source.</li>
 *   <li>Only a BCrypt <em>hash</em> is persisted — the plain code never touches
 *       the database.</li>
 *   <li>Codes expire (default 10 min) and permit a small number of failed
 *       attempts (default 5) before being locked.</li>
 *   <li>Resends are throttled (default 60 s) to keep the endpoint from being
 *       used as an email-bomb.</li>
 * </ul>
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    /** Cryptographically strong generator for the codes. */
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /** Shared encoder — OTP hashes are one-way, exactly like passwords. */
    private static final PasswordEncoder OTP_ENCODER = new BCryptPasswordEncoder(10);

    private final EmailOtpRepository otpRepository;
    private final EmailService emailService;

    @Value("${app.otp.expiry-minutes:10}")
    private long expiryMinutes;

    @Value("${app.otp.resend-after-seconds:60}")
    private long resendAfterSeconds;

    @Value("${app.otp.max-attempts:5}")
    private int maxAttempts;

    /**
     * Generates, persists, and emails a new code for the given address and
     * purpose. Any previously pending code for the same pair is retired so
     * only the newest code is ever accepted.
     *
     * @param rawEmail the recipient address (trimmed + lowercased)
     * @param purpose  why the code is being issued
     * @return metadata about the issued code (never the code itself)
     * @throws BadRequestException if a code was issued too recently
     */
    @Transactional
    public OtpSendResponse sendOtp(final String rawEmail, final OtpPurpose purpose) {
        final String email = normalize(rawEmail);
        final LocalDateTime now = LocalDateTime.now();

        // Resend throttle: a pending code that is still inside the cooldown
        // window blocks a new one (prevents inbox flooding).
        otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(email, purpose)
                .filter(pending -> pending.getCreatedAt().plusSeconds(resendAfterSeconds).isAfter(now))
                .ifPresent(pending -> {
                    throw new BadRequestException(
                            "A code was sent recently. Please wait a moment before requesting another.");
                });

        // Retire superseded codes so verification can only ever match the newest one.
        otpRepository.deleteAll(
                otpRepository.findAllByEmailAndPurposeAndVerifiedAtIsNull(email, purpose));

        final String code = generateCode();
        final EmailOtp otp = EmailOtp.builder()
                .email(email)
                .purpose(purpose)
                .otpHash(OTP_ENCODER.encode(code))
                .expiresAt(now.plusMinutes(expiryMinutes))
                .build();
        otpRepository.save(otp);

        final boolean passwordReset = purpose == OtpPurpose.PASSWORD_RESET;
        final Map<String, Object> variables = Map.of(
                AppConstants.VAR_OTP_CODE, code,
                AppConstants.VAR_OTP_EXPIRY_MINUTES, expiryMinutes,
                AppConstants.VAR_APP_NAME, AppConstants.APP_NAME,
                AppConstants.VAR_SUPPORT_EMAIL, AppConstants.SUPPORT_EMAIL);

        final boolean delivered = emailService.sendTemplate(
                email,
                passwordReset ? AppConstants.SUBJECT_PASSWORD_RESET : AppConstants.SUBJECT_OTP_VERIFICATION,
                passwordReset ? AppConstants.TEMPLATE_PASSWORD_RESET : AppConstants.TEMPLATE_OTP_VERIFICATION,
                variables);

        if (delivered) {
            log.info("OTP sent to {} for purpose {}", email, purpose);
        } else {
            // SMTP delivery failed (bad credentials, unverified sender, etc.) —
            // surface the code in the logs so the flow stays usable during local dev.
            log.warn("OTP email to {} (purpose {}) could not be delivered. Dev fallback code: {}",
                    email, purpose, code);
        }

        return OtpSendResponse.builder()
                .email(email)
                .purpose(purpose)
                .expiresInSeconds(expiryMinutes * 60)
                .resendAfterSeconds(resendAfterSeconds)
                .build();
    }

    /**
     * Redeems a code. The newest pending code for the (email, purpose) pair is
     * checked for expiry, attempt budget, and a hash match. Successful
     * verification marks the code consumed so it cannot be replayed.
     *
     * @param rawEmail the recipient address (trimmed + lowercased)
     * @param purpose  the purpose the code was issued for
     * @param code     the 6-digit code to verify
     * @return the verification result
     * @throws BadRequestException if the code is missing, expired, or wrong
     */
    @Transactional
    public OtpVerifyResponse verifyOtp(final String rawEmail, final OtpPurpose purpose, final String code) {
        final String email = normalize(rawEmail);

        final EmailOtp otp = otpRepository
                .findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification code."));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This code has expired. Request a new one.");
        }

        if (otp.getAttemptCount() >= maxAttempts) {
            throw new BadRequestException("Too many failed attempts. Request a new code.");
        }

        if (!OTP_ENCODER.matches(code, otp.getOtpHash())) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            otpRepository.save(otp);
            final int remaining = maxAttempts - otp.getAttemptCount();
            throw new BadRequestException(remaining > 0
                    ? "That code isn't right. " + remaining + " attempt" + (remaining == 1 ? "" : "s") + " left."
                    : "Too many failed attempts. Request a new code.");
        }

        otp.setVerifiedAt(LocalDateTime.now());
        otpRepository.save(otp);
        log.info("OTP verified for {} (purpose {})", email, purpose);
        return OtpVerifyResponse.builder().valid(true).build();
    }

    /**
     * Generates a uniformly random 6-digit code with leading zeros preserved.
     *
     * @return the code as a zero-padded string
     */
    private String generateCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    /**
     * Normalizes an email address for storage and lookup.
     *
     * @param email the raw address
     * @return trimmed + lowercased address
     */
    private String normalize(final String email) {
        return email.trim().toLowerCase();
    }
}
