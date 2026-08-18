package com.neighbornest.notificationservice.config;

import com.neighbornest.notificationservice.constants.AppConstants;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Startup validation for the EmailJS delivery configuration used by the auth
 * flows (registration verification + password reset).
 * <p>
 * When any piece is missing — public/private key, service id, or the
 * {@code otp-verification}/{@code password-reset} template ids — every OTP
 * email silently fails at request time and users see a generic "we couldn't
 * send the code" error. This check makes the problem obvious at boot instead:
 * it logs an actionable ERROR naming exactly what is missing and where to set
 * it, so a misconfigured email setup can never masquerade as a code bug.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailJsConfigCheck {

    private final EmailJsProperties properties;

    /**
     * Runs at startup and logs a prominent error if the EmailJS config is
     * incomplete. A warning-level concern only — the service still boots so
     * in-app notifications and SMS keep working.
     */
    @PostConstruct
    public void validateOnStartup() {
        final List<String> missing = validate();
        if (missing.isEmpty()) {
            log.info("EmailJS config OK — service '{}', templates otp-verification '{}', password-reset '{}'",
                    properties.getServiceId(),
                    properties.getTemplates().get(AppConstants.TEMPLATE_OTP_VERIFICATION),
                    properties.getTemplates().get(AppConstants.TEMPLATE_PASSWORD_RESET));
            return;
        }
        log.error("====================================================================\n"
                        + "EmailJS is NOT fully configured — registration and password-reset\n"
                        + "emails will NOT be sent until this is fixed. Missing:\n"
                        + "  - {}\n"
                        + "Set them under 'emailjs:' in\n"
                        + "backend/notification-service/src/main/resources/application.yml\n"
                        + "(or as EMAILJS_* env vars in backend/.env / docker-compose), then\n"
                        + "restart. See backend/notification-service/emailjs-templates/README.md.\n"
                        + "====================================================================",
                String.join("\n  - ", missing));
    }

    /**
     * Checks the EmailJS settings the auth-flow OTP emails depend on.
     *
     * @return the names of the missing/unset configuration items; empty if the
     *         config is complete
     */
    List<String> validate() {
        final List<String> missing = new ArrayList<>();
        if (!StringUtils.hasText(properties.getPublicKey())) {
            missing.add("emailjs.public-key (EMAILJS_PUBLIC_KEY)");
        }
        if (!StringUtils.hasText(properties.getPrivateKey())) {
            missing.add("emailjs.private-key (EMAILJS_PRIVATE_KEY)");
        }
        if (!StringUtils.hasText(properties.getServiceId())) {
            missing.add("emailjs.service-id (EMAILJS_SERVICE_ID)");
        }
        if (!StringUtils.hasText(properties.getTemplates().get(AppConstants.TEMPLATE_OTP_VERIFICATION))) {
            missing.add("emailjs.templates.otp-verification (EMAILJS_TEMPLATE_OTP_VERIFICATION)");
        }
        if (!StringUtils.hasText(properties.getTemplates().get(AppConstants.TEMPLATE_PASSWORD_RESET))) {
            missing.add("emailjs.templates.password-reset (EMAILJS_TEMPLATE_PASSWORD_RESET)");
        }
        return missing;
    }
}
