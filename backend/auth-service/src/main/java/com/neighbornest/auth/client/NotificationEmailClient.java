package com.neighbornest.auth.client;

import com.neighbornest.auth.dto.request.SendOtpRequest;
import com.neighbornest.auth.dto.request.VerifyOtpRequest;
import com.neighbornest.auth.dto.request.WelcomeEmailRequest;
import com.neighbornest.auth.dto.response.OtpSendResponse;
import com.neighbornest.auth.dto.response.OtpVerifyResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client for the notification-service's email endpoints.
 * <p>
 * The notification-service is the platform's email service: it generates,
 * stores, and emails one-time passcodes, and renders the transactional email
 * templates. This client lets the auth-service delegate OTP delivery and
 * verification (registration + password reset) without owning any SMTP or
 * template infrastructure itself.
 * </p>
 * <p>
 * All calls carry the shared {@code X-Internal-Key} header via
 * {@code FeignClientConfig} so the notification-service's internal endpoints
 * accept them; the public OTP endpoints simply ignore the extra header.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@FeignClient(name = "notification-service")
public interface NotificationEmailClient {

    /**
     * Emails a one-time passcode for the requested purpose.
     *
     * @param request the email + purpose
     * @return metadata about the issued code (never the code itself)
     */
    @PostMapping("/api/notifications/email/otp/send")
    OtpSendResponse sendOtp(@RequestBody SendOtpRequest request);

    /**
     * Redeems a one-time passcode, proving inbox ownership.
     *
     * @param request the email + purpose + code
     * @return the verification result
     */
    @PostMapping("/api/notifications/email/otp/verify")
    OtpVerifyResponse verifyOtp(@RequestBody VerifyOtpRequest request);

    /**
     * Sends the post-registration welcome email (internal, best-effort).
     *
     * @param request the new user's email and full name
     */
    @PostMapping("/api/notifications/internal/email/welcome")
    void sendWelcome(@RequestBody WelcomeEmailRequest request);
}
