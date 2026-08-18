package com.neighbornest.notificationservice.service;

import com.neighbornest.notificationservice.dto.response.OtpSendResponse;
import com.neighbornest.notificationservice.dto.response.OtpVerifyResponse;
import com.neighbornest.notificationservice.entity.EmailOtp;
import com.neighbornest.notificationservice.enums.OtpPurpose;
import com.neighbornest.notificationservice.exception.BadRequestException;
import com.neighbornest.notificationservice.repository.EmailOtpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link OtpService} — the email service's one-time passcode
 * logic.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OtpService Unit Tests")
class OtpServiceTest {

    private static final String EMAIL = "jane.doe@example.com";
    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(10);

    @Mock
    private EmailOtpRepository otpRepository;

    @Mock
    private EmailService emailService;

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService(otpRepository, emailService);
        ReflectionTestUtils.setField(otpService, "expiryMinutes", 10L);
        ReflectionTestUtils.setField(otpService, "resendAfterSeconds", 60L);
        ReflectionTestUtils.setField(otpService, "maxAttempts", 5);
    }

    /** A pending (unverified) OTP row hashed with the given code. */
    private EmailOtp pendingOtp(final String code, final int attempts, final LocalDateTime expiresAt) {
        return EmailOtp.builder()
                .id(1L)
                .email(EMAIL)
                .purpose(OtpPurpose.EMAIL_VERIFICATION)
                .otpHash(ENCODER.encode(code))
                .attemptCount(attempts)
                .expiresAt(expiresAt)
                .createdAt(LocalDateTime.now().minusMinutes(1))
                .build();
    }

    @Nested
    @DisplayName("sendOtp")
    class SendOtpTests {

        @Test
        @DisplayName("Should generate, persist, and email a code; never return it")
        void shouldSendAndPersistCode() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(anyString(), any()))
                    .thenReturn(Optional.empty());
            when(emailService.sendTemplate(anyString(), anyString(), anyString(), anyMap())).thenReturn(true);

            final OtpSendResponse response = otpService.sendOtp("  " + EMAIL.toUpperCase() + "  ",
                    OtpPurpose.EMAIL_VERIFICATION);

            assertThat(response.getEmail()).isEqualTo(EMAIL);
            assertThat(response.getExpiresInSeconds()).isEqualTo(600);
            assertThat(response.getResendAfterSeconds()).isEqualTo(60);

            final ArgumentCaptor<EmailOtp> captor = ArgumentCaptor.forClass(EmailOtp.class);
            verify(otpRepository).save(captor.capture());
            final EmailOtp saved = captor.getValue();
            assertThat(saved.getEmail()).isEqualTo(EMAIL);
            assertThat(saved.getOtpHash()).isNotBlank();
            assertThat(saved.getOtpHash()).doesNotContain("123456");

            // The email must receive the code, expiry, and brand under every
            // placeholder convention so it renders correctly no matter which
            // EmailJS dashboard template is configured.
            @SuppressWarnings("unchecked")
            final ArgumentCaptor<Map<String, Object>> varsCaptor = ArgumentCaptor.forClass(Map.class);
            verify(emailService).sendTemplate(eq(EMAIL), anyString(),
                    eq("otp-verification"), varsCaptor.capture());
            final Map<String, Object> vars = varsCaptor.getValue();
            assertThat(vars.get("otpCode")).isEqualTo(vars.get("passcode"));
            assertThat((String) vars.get("passcode")).isNotBlank();
            assertThat(vars.get("expiryMinutes")).isEqualTo(10L);
            assertThat(vars.get("time")).isEqualTo("10 minutes");
            assertThat(vars.get("appName")).isEqualTo("NeighborNest");
            assertThat(vars.get("companyName")).isEqualTo("NeighborNest");
            assertThat(vars.get("company_name")).isEqualTo("NeighborNest");
            assertThat(vars.get("supportEmail")).isEqualTo("support@neighbornest.com");
            assertThat(vars.get("support_email")).isEqualTo("support@neighbornest.com");
        }

        @Test
        @DisplayName("Should use the password-reset template and subject for a reset request")
        void shouldUsePasswordResetTemplate() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(anyString(), any()))
                    .thenReturn(Optional.empty());
            when(emailService.sendTemplate(anyString(), anyString(), anyString(), anyMap())).thenReturn(true);

            otpService.sendOtp(EMAIL, OtpPurpose.PASSWORD_RESET);

            verify(emailService).sendTemplate(eq(EMAIL),
                    eq("Reset your NeighborNest password"), eq("password-reset"), anyMap());
        }

        @Test
        @DisplayName("Should throw when a code was issued too recently")
        void shouldThrottleResends() {
            // Issued 10 s ago — inside the 60 s cooldown, so a resend is blocked.
            final EmailOtp recent = EmailOtp.builder()
                    .email(EMAIL)
                    .purpose(OtpPurpose.EMAIL_VERIFICATION)
                    .otpHash(ENCODER.encode("123456"))
                    .attemptCount(0)
                    .expiresAt(LocalDateTime.now().plusMinutes(9))
                    .createdAt(LocalDateTime.now().minusSeconds(10))
                    .build();
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(EMAIL,
                    OtpPurpose.EMAIL_VERIFICATION)).thenReturn(Optional.of(recent));

            assertThatThrownBy(() -> otpService.sendOtp(EMAIL, OtpPurpose.EMAIL_VERIFICATION))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("wait a moment");
            verify(otpRepository, never()).save(any());
            verify(emailService, never()).sendTemplate(anyString(), anyString(), anyString(), anyMap());
        }

        @Test
        @DisplayName("Should fail the request when the email could not be delivered")
        void shouldThrowWhenEmailDeliveryFails() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(anyString(), any()))
                    .thenReturn(Optional.empty());
            when(emailService.sendTemplate(anyString(), anyString(), anyString(), anyMap())).thenReturn(false);

            assertThatThrownBy(() -> otpService.sendOtp(EMAIL, OtpPurpose.EMAIL_VERIFICATION))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("couldn't send the verification code");
        }

        @Test
        @DisplayName("Should retire superseded pending codes before issuing a new one")
        void shouldRetireOldPendingCodes() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(anyString(), any()))
                    .thenReturn(Optional.empty());
            when(emailService.sendTemplate(anyString(), anyString(), anyString(), anyMap())).thenReturn(true);

            otpService.sendOtp(EMAIL, OtpPurpose.EMAIL_VERIFICATION);

            verify(otpRepository).deleteAll(any());
        }
    }

    @Nested
    @DisplayName("verifyOtp")
    class VerifyOtpTests {

        @Test
        @DisplayName("Should verify the correct code and consume it")
        void shouldVerifyCorrectCode() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(EMAIL,
                    OtpPurpose.EMAIL_VERIFICATION))
                    .thenReturn(Optional.of(pendingOtp("123456", 0, LocalDateTime.now().plusMinutes(9))));

            final OtpVerifyResponse response = otpService.verifyOtp(EMAIL, OtpPurpose.EMAIL_VERIFICATION, "123456");

            assertThat(response.isValid()).isTrue();
            final ArgumentCaptor<EmailOtp> captor = ArgumentCaptor.forClass(EmailOtp.class);
            verify(otpRepository).save(captor.capture());
            assertThat(captor.getValue().getVerifiedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject an unknown or already-consumed code")
        void shouldRejectMissingCode() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(EMAIL,
                    OtpPurpose.EMAIL_VERIFICATION)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> otpService.verifyOtp(EMAIL, OtpPurpose.EMAIL_VERIFICATION, "123456"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Invalid or expired");
        }

        @Test
        @DisplayName("Should reject an expired code")
        void shouldRejectExpiredCode() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(EMAIL,
                    OtpPurpose.EMAIL_VERIFICATION))
                    .thenReturn(Optional.of(pendingOtp("123456", 0, LocalDateTime.now().minusMinutes(1))));

            assertThatThrownBy(() -> otpService.verifyOtp(EMAIL, OtpPurpose.EMAIL_VERIFICATION, "123456"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("expired");
        }

        @Test
        @DisplayName("Should count failed attempts and report how many remain")
        void shouldCountFailedAttempts() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(EMAIL,
                    OtpPurpose.EMAIL_VERIFICATION))
                    .thenReturn(Optional.of(pendingOtp("123456", 1, LocalDateTime.now().plusMinutes(9))));

            assertThatThrownBy(() -> otpService.verifyOtp(EMAIL, OtpPurpose.EMAIL_VERIFICATION, "000000"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("3 attempts left");

            final ArgumentCaptor<EmailOtp> captor = ArgumentCaptor.forClass(EmailOtp.class);
            verify(otpRepository).save(captor.capture());
            assertThat(captor.getValue().getAttemptCount()).isEqualTo(2);
        }

        @Test
        @DisplayName("Should lock the code after the attempt budget is exhausted")
        void shouldLockAfterMaxAttempts() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(EMAIL,
                    OtpPurpose.EMAIL_VERIFICATION))
                    .thenReturn(Optional.of(pendingOtp("123456", 5, LocalDateTime.now().plusMinutes(9))));

            assertThatThrownBy(() -> otpService.verifyOtp(EMAIL, OtpPurpose.EMAIL_VERIFICATION, "123456"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Too many failed attempts");
            verify(otpRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should be case-insensitive and normalize the email for lookup")
        void shouldNormalizeEmailForLookup() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(EMAIL,
                    OtpPurpose.EMAIL_VERIFICATION))
                    .thenReturn(Optional.of(pendingOtp("123456", 0, LocalDateTime.now().plusMinutes(9))));

            otpService.verifyOtp("  JANE.DOE@EXAMPLE.COM ", OtpPurpose.EMAIL_VERIFICATION, "123456");

            verify(otpRepository).findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(
                    eq(EMAIL), eq(OtpPurpose.EMAIL_VERIFICATION));
        }

        @Test
        @DisplayName("Should list only pending codes when retiring superseded rows")
        void shouldQueryPendingForRetirement() {
            when(otpRepository.findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(anyString(), any()))
                    .thenReturn(Optional.empty());
            when(otpRepository.findAllByEmailAndPurposeAndVerifiedAtIsNull(EMAIL, OtpPurpose.EMAIL_VERIFICATION))
                    .thenReturn(List.of());
            when(emailService.sendTemplate(anyString(), anyString(), anyString(), anyMap())).thenReturn(true);

            otpService.sendOtp(EMAIL, OtpPurpose.EMAIL_VERIFICATION);

            verify(otpRepository).findAllByEmailAndPurposeAndVerifiedAtIsNull(EMAIL, OtpPurpose.EMAIL_VERIFICATION);
        }
    }
}
