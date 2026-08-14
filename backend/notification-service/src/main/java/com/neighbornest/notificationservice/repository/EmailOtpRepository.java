package com.neighbornest.notificationservice.repository;

import com.neighbornest.notificationservice.entity.EmailOtp;
import com.neighbornest.notificationservice.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for {@link EmailOtp} rows.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    /**
     * Returns the newest pending (unverified) code for an (email, purpose) pair.
     *
     * @param email   the normalized recipient address
     * @param purpose the OTP purpose
     * @return the newest pending code, if any
     */
    Optional<EmailOtp> findTopByEmailAndPurposeAndVerifiedAtIsNullOrderByCreatedAtDesc(
            String email, OtpPurpose purpose);

    /**
     * Returns every pending code for an (email, purpose) pair — used to retire
     * superseded codes when a fresh one is issued.
     *
     * @param email   the normalized recipient address
     * @param purpose the OTP purpose
     * @return all pending codes for the pair
     */
    List<EmailOtp> findAllByEmailAndPurposeAndVerifiedAtIsNull(String email, OtpPurpose purpose);

    /**
     * Deletes codes that expired before the given cutoff (keeps the table
     * from growing unboundedly).
     *
     * @param cutoff the expiry threshold
     * @return the number of rows deleted
     */
    @Modifying
    @Query("delete from EmailOtp o where o.expiresAt < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}
