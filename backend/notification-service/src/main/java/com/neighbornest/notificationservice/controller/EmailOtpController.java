package com.neighbornest.notificationservice.controller;

import com.neighbornest.notificationservice.dto.request.SendOtpRequest;
import com.neighbornest.notificationservice.dto.request.VerifyOtpRequest;
import com.neighbornest.notificationservice.dto.response.OtpSendResponse;
import com.neighbornest.notificationservice.dto.response.OtpVerifyResponse;
import com.neighbornest.notificationservice.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public endpoints for one-time passcodes sent by email.
 * <p>
 * These endpoints are deliberately unauthenticated — they are the first step
 * of the registration and password-reset flows, which run before the user has
 * any credentials. Callers (the auth-service, and the web app through the
 * gateway) must handle the send throttle and verification failures the
 * service reports.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
@RequestMapping(value = "/api/notifications/email", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Email OTP", description = "Public one-time passcode endpoints (registration verification, password reset)")
public class EmailOtpController {

    private final OtpService otpService;

    /**
     * Emails a 6-digit code to the given address for the requested purpose.
     *
     * @param request the send request (email + purpose)
     * @return metadata about the issued code (never the code itself)
     */
    @PostMapping("/otp/send")
    @Operation(summary = "Send a one-time passcode by email",
            description = "Generates, stores, and emails a 6-digit code. Throttled to one code per cooldown window.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Code issued and emailed"),
            @ApiResponse(responseCode = "400", description = "Invalid input or code requested too soon")
    })
    public OtpSendResponse sendOtp(@Valid @RequestBody final SendOtpRequest request) {
        log.debug("POST /api/notifications/email/otp/send - purpose {} for {}", request.getPurpose(), request.getEmail());
        return otpService.sendOtp(request.getEmail(), request.getPurpose());
    }

    /**
     * Redeems a code, proving the caller owns the inbox.
     *
     * @param request the verify request (email + purpose + code)
     * @return the verification result
     */
    @PostMapping("/otp/verify")
    @Operation(summary = "Verify a one-time passcode",
            description = "Redeems the newest pending code for the (email, purpose) pair. A successful verify consumes the code.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Code verified and consumed"),
            @ApiResponse(responseCode = "400", description = "Invalid, expired, or too many failed attempts")
    })
    public OtpVerifyResponse verifyOtp(@Valid @RequestBody final VerifyOtpRequest request) {
        log.debug("POST /api/notifications/email/otp/verify - purpose {} for {}", request.getPurpose(), request.getEmail());
        return otpService.verifyOtp(request.getEmail(), request.getPurpose(), request.getOtp());
    }
}
