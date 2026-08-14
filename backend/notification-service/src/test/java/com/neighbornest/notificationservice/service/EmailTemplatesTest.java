package com.neighbornest.notificationservice.service;

import com.neighbornest.notificationservice.repository.EmailTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.templateresolver.StringTemplateResolver;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Rendering tests for the auth-flow email templates.
 * <p>
 * Proves the OTP verification, password-reset, and welcome emails render
 * with the <em>exact</em> variable maps the services send, and that the
 * plain-text fallback keeps the important content (the code, the link).
 * A template that renders without its variables here would ship empty
 * emails to real users.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Email template rendering tests")
class EmailTemplatesTest {

    private static final Map<String, Object> OTP_VARIABLES = Map.of(
            "otpCode", "482913",
            "expiryMinutes", 10L,
            "appName", "NeighborNest",
            "supportEmail", "support@neighbornest.com");

    private static final Map<String, Object> WELCOME_VARIABLES = Map.of(
            "fullName", "Jane Doe",
            "appName", "NeighborNest",
            "dashboardLink", "http://localhost:8080/dashboard");

    @Mock
    private EmailTemplateRepository emailTemplateRepository;

    private TemplateService templateService;

    @BeforeEach
    void setUp() {
        // Replicate the production engine setup from TemplateConfig: classpath
        // resolver for built-in templates, string resolver for DB templates.
        final SpringTemplateEngine classpathEngine = new SpringTemplateEngine();
        final ClassLoaderTemplateResolver classpathResolver = new ClassLoaderTemplateResolver();
        classpathResolver.setPrefix("templates/");
        classpathResolver.setSuffix(".html");
        classpathResolver.setTemplateMode(TemplateMode.HTML);
        classpathEngine.setTemplateResolver(classpathResolver);

        final SpringTemplateEngine stringEngine = new SpringTemplateEngine();
        final StringTemplateResolver stringResolver = new StringTemplateResolver();
        stringResolver.setTemplateMode(TemplateMode.HTML);
        stringEngine.setTemplateResolver(stringResolver);

        templateService = new TemplateService(emailTemplateRepository, classpathEngine, stringEngine);
        when(emailTemplateRepository.findByTemplateKey(anyString())).thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("OTP verification email renders the code, expiry, and brand")
    void shouldRenderOtpVerificationEmail() {
        final String html = templateService.renderHtml("otp-verification", OTP_VARIABLES);
        final String text = templateService.renderText("otp-verification", OTP_VARIABLES);

        assertThat(html)
                .contains("Verify your email")
                .contains("482913")
                .contains("expires in")
                .contains("10")
                .contains("NeighborNest");
        assertThat(html).doesNotContain("${");
        // Plain-text fallback must keep the code readable.
        assertThat(text)
                .contains("482913")
                .doesNotContain("<");
    }

    @Test
    @DisplayName("Password-reset email renders the code and reset guidance")
    void shouldRenderPasswordResetEmail() {
        final String html = templateService.renderHtml("password-reset", OTP_VARIABLES);
        final String text = templateService.renderText("password-reset", OTP_VARIABLES);

        assertThat(html)
                .contains("Reset your password")
                .contains("482913")
                .contains("expires in")
                .contains("NeighborNest");
        assertThat(html).doesNotContain("${");
        assertThat(text).contains("482913").doesNotContain("<");
    }

    @Test
    @DisplayName("Welcome email renders the name and dashboard link")
    void shouldRenderWelcomeEmail() {
        final String html = templateService.renderHtml("welcome", WELCOME_VARIABLES);
        final String text = templateService.renderText("welcome", WELCOME_VARIABLES);

        assertThat(html)
                .contains("Welcome")
                .contains("Jane Doe")
                .contains("Your account is ready")
                .contains("http://localhost:8080/dashboard");
        assertThat(html).doesNotContain("${");
        // The dashboard link must survive into the plain-text fallback.
        assertThat(text)
                .contains("Welcome")
                .contains("Go to your dashboard (http://localhost:8080/dashboard)")
                .doesNotContain("<");
    }

    @Test
    @DisplayName("Every OTP template's variables are consumed by the template")
    void shouldConsumeEveryProvidedVariable() {
        // A variable the template never references means a mismatch that will
        // ship an empty code/link to a real user — catch it by rendering with
        // deliberately odd values and asserting they appear.
        final Map<String, Object> odd = Map.of(
                "otpCode", "111111",
                "expiryMinutes", 42L,
                "appName", "TestBrand",
                "supportEmail", "test@example.com");

        final String html = templateService.renderHtml("otp-verification", odd);

        assertThat(html)
                .contains("111111")
                .contains("42")
                .contains("TestBrand")
                .contains("test@example.com");
    }
}
