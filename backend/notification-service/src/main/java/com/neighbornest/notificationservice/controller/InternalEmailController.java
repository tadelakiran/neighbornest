package com.neighbornest.notificationservice.controller;

import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.dto.request.WelcomeEmailRequest;
import com.neighbornest.notificationservice.service.EmailService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Service-to-service email endpoints for the auth-service.
 * <p>
 * These routes live under {@code /api/notifications/internal/**} and are
 * guarded by the {@code X-Internal-Key} header check performed by
 * {@code InternalApiKeyFilter}. They must never be called by the browser
 * directly — the auth-service is the only legitimate caller.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
@RequestMapping(value = "/api/notifications/internal/email", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Slf4j
@Hidden
public class InternalEmailController {

    private final EmailService emailService;

    @Value("${app.notification.base-url:http://localhost:8080}")
    private String baseUrl;

    /**
     * Sends the post-registration welcome email (best-effort).
     *
     * @param request the new user's email and full name
     * @return 202 Accepted (delivery is best-effort)
     */
    @PostMapping("/welcome")
    public ResponseEntity<Void> sendWelcome(@Valid @RequestBody final WelcomeEmailRequest request) {
        final Map<String, Object> variables = Map.of(
                AppConstants.VAR_FULL_NAME, request.getFullName(),
                AppConstants.VAR_APP_NAME, AppConstants.APP_NAME,
                AppConstants.VAR_DASHBOARD_LINK, baseUrl + "/dashboard");

        final boolean delivered = emailService.sendTemplate(
                request.getEmail(),
                AppConstants.SUBJECT_WELCOME,
                AppConstants.TEMPLATE_WELCOME,
                variables);

        if (delivered) {
            log.info("Welcome email sent to {}", request.getEmail());
        } else {
            log.warn("Welcome email to {} could not be delivered", request.getEmail());
        }
        return ResponseEntity.accepted().build();
    }
}
