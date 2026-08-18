package com.neighbornest.notificationservice.config;

import com.neighbornest.notificationservice.constants.AppConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link EmailJsConfigCheck} — the startup validation that
 * keeps a half-configured EmailJS setup from silently swallowing OTP emails.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@DisplayName("EmailJsConfigCheck Unit Tests")
class EmailJsConfigCheckTest {

    private EmailJsProperties properties() {
        final EmailJsProperties props = new EmailJsProperties();
        props.setPublicKey("public-key");
        props.setPrivateKey("private-key");
        props.setServiceId("service-id");
        props.getTemplates().put("otp-verification", "template_otp");
        props.getTemplates().put("password-reset", "template_reset");
        return props;
    }

    @Test
    @DisplayName("Should report an empty list when the auth-flow config is complete")
    void shouldPassWhenConfigured() {
        final EmailJsConfigCheck check = new EmailJsConfigCheck(properties());

        assertThat(check.validate()).isEmpty();
    }

    @Test
    @DisplayName("Should flag every missing key, service id, and auth template")
    void shouldListEveryMissingItem() {
        final EmailJsProperties props = properties();
        props.setPublicKey(null);
        props.setPrivateKey("  ");
        props.setServiceId(null);
        props.getTemplates().clear();

        final List<String> missing = new EmailJsConfigCheck(props).validate();

        assertThat(missing)
                .contains("emailjs.public-key (EMAILJS_PUBLIC_KEY)")
                .contains("emailjs.private-key (EMAILJS_PRIVATE_KEY)")
                .contains("emailjs.service-id (EMAILJS_SERVICE_ID)")
                .contains("emailjs.templates.otp-verification (EMAILJS_TEMPLATE_OTP_VERIFICATION)")
                .contains("emailjs.templates.password-reset (EMAILJS_TEMPLATE_PASSWORD_RESET)");
    }

    @Test
    @DisplayName("Should flag the password-reset template specifically")
    void shouldFlagMissingPasswordResetTemplate() {
        final EmailJsProperties props = properties();
        props.getTemplates().remove(AppConstants.TEMPLATE_PASSWORD_RESET);

        final List<String> missing = new EmailJsConfigCheck(props).validate();

        assertThat(missing)
                .contains("emailjs.templates.password-reset (EMAILJS_TEMPLATE_PASSWORD_RESET)")
                .doesNotContain("emailjs.templates.otp-verification (EMAILJS_TEMPLATE_OTP_VERIFICATION)");
    }
}
