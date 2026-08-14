package com.neighbornest.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.auth.client.NotificationEmailClient;
import com.neighbornest.auth.dto.request.ResetPasswordRequest;
import com.neighbornest.auth.dto.request.SendOtpRequest;
import com.neighbornest.auth.dto.request.VerifyOtpRequest;
import com.neighbornest.auth.dto.response.OtpVerifyResponse;
import com.neighbornest.auth.entity.User;
import com.neighbornest.auth.enums.OtpPurpose;
import com.neighbornest.auth.exception.BadRequestException;
import com.neighbornest.auth.repository.UserRepository;
import com.neighbornest.auth.util.PasswordValidator;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Password recovery for the Auth Service.
 * <p>
 * The forgot-password step requests a one-time passcode from the email
 * service; the reset step redeems that code (proving the requester owns the
 * inbox) and updates the password hash. The forgot step always reports
 * success so the endpoint never reveals which email addresses are registered.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationEmailClient notificationEmailClient;
    private final ObjectMapper objectMapper;

    /**
     * Emails a password-reset code to the account, if one exists.
     * <p>
     * For unknown emails the request is silently ignored — always return the
     * same success message regardless, so callers cannot enumerate accounts.
     * </p>
     *
     * @param rawEmail the account email address
     */
    @Transactional
    public void forgotPassword(final String rawEmail) {
        final String email = rawEmail.trim().toLowerCase();

        userRepository.findByEmail(email).ifPresent(user -> {
            try {
                notificationEmailClient.sendOtp(SendOtpRequest.builder()
                        .email(email)
                        .purpose(OtpPurpose.PASSWORD_RESET)
                        .build());
                log.info("Password reset code sent to {}", email);
            } catch (final FeignException e) {
                log.warn("Failed to send password reset code to {}: {}", email, e.getMessage());
                throw new BadRequestException("We couldn't send the reset code right now. Please try again.");
            }
        });
    }

    /**
     * Resets a user's password after the reset code is verified.
     *
     * @param request the email, code, and new password
     * @throws BadRequestException if the code is invalid/expired or the user does not exist
     */
    @Transactional
    public void resetPassword(final ResetPasswordRequest request) {
        final List<String> passwordErrors = PasswordValidator.validate(request.getNewPassword());
        if (!passwordErrors.isEmpty()) {
            throw new IllegalArgumentException(
                    "Password validation failed: " + String.join("; ", passwordErrors));
        }

        final String email = request.getEmail().trim().toLowerCase();
        final User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification code."));

        try {
            final OtpVerifyResponse response = notificationEmailClient.verifyOtp(VerifyOtpRequest.builder()
                    .email(email)
                    .purpose(OtpPurpose.PASSWORD_RESET)
                    .otp(request.getOtp())
                    .build());
            if (response == null || !response.isValid()) {
                throw new BadRequestException("Invalid or expired verification code.");
            }
        } catch (final FeignException e) {
            final String reason = extractFeignMessage(e);
            throw new BadRequestException(
                    reason != null ? reason : "Invalid or expired verification code.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password reset completed for user: {}", email);
    }

    /**
     * Extracts the {@code message} field from a Feign error response body, so
     * the email service's precise reason (expired code, attempts remaining)
     * can be surfaced to the user.
     *
     * @param e the Feign exception
     * @return the upstream message, or {@code null} if it cannot be parsed
     */
    private String extractFeignMessage(final FeignException e) {
        try {
            return e.responseBody()
                    .map(buffer -> {
                        final byte[] bytes = new byte[buffer.remaining()];
                        buffer.get(bytes);
                        try {
                            final JsonNode node = objectMapper.readTree(
                                    new String(bytes, StandardCharsets.UTF_8));
                            return node.path("message").asText(null);
                        } catch (final Exception ex) {
                            return null;
                        }
                    })
                    .orElse(null);
        } catch (final Exception ex) {
            return null;
        }
    }
}
