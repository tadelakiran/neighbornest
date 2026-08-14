package com.neighbornest.notificationservice.entity;

import com.neighbornest.notificationservice.enums.OtpPurpose;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity representing a one-time passcode issued by the email service.
 * <p>
 * Codes are stored <em>hashed</em> (BCrypt) so a database leak never exposes
 * usable OTPs. Each row carries its own expiry, failed-attempt counter, and
 * verification timestamp; only the newest pending row for an
 * (email, purpose) pair is ever accepted.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "email_otps", indexes = {
        @Index(name = "idx_email_otp_lookup", columnList = "email,purpose,created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailOtp {

    /** Primary key, auto-generated. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The address the code was sent to (normalized lowercase). */
    @Column(nullable = false, length = 255)
    private String email;

    /** Why the code was issued. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private OtpPurpose purpose;

    /** BCrypt hash of the 6-digit code — never the plain code. */
    @Column(name = "otp_hash", nullable = false, length = 100)
    private String otpHash;

    /** When the code stops being valid. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /** Number of failed verification attempts (caps brute force). */
    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    /** Set once the code has been successfully redeemed. */
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /** When the code was issued. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Assigns the issue timestamp before the first persist.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
