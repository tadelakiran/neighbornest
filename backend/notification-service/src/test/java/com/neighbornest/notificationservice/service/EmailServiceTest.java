package com.neighbornest.notificationservice.service;

import com.neighbornest.notificationservice.config.EmailJsProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Unit tests for {@link EmailService} — the EmailJS REST delivery path,
 * exercised against a {@link MockRestServiceServer} so the exact HTTP request
 * is verified.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@DisplayName("EmailService Unit Tests")
class EmailServiceTest {

    private static final String PUBLIC_KEY = "public-key";
    private static final String PRIVATE_KEY = "private-key";
    private static final String SERVICE_ID = "service-id";
    private static final String EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";

    private EmailJsProperties properties;
    private MockRestServiceServer server;
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        properties = new EmailJsProperties();
        properties.setPublicKey(PUBLIC_KEY);
        properties.setPrivateKey(PRIVATE_KEY);
        properties.setServiceId(SERVICE_ID);
        properties.getTemplates().put("otp-verification", "template_otp");

        final RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        emailService = new EmailService(properties, builder);
    }

    @Nested
    @DisplayName("sendTemplate")
    class SendTemplateTests {

        @Test
        @DisplayName("Should POST the EmailJS payload and report success")
        void shouldSendViaEmailJs() {
            server.expect(once(), requestTo(EMAILJS_URL))
                    .andExpect(method(HttpMethod.POST))
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(header("Origin", "http://localhost:5173"))
                    .andExpect(header("Referer", "http://localhost:5173/"))
                    .andExpect(jsonPath("$.service_id").value(SERVICE_ID))
                    .andExpect(jsonPath("$.template_id").value("template_otp"))
                    .andExpect(jsonPath("$.user_id").value(PUBLIC_KEY))
                    .andExpect(jsonPath("$.accessToken").value(PRIVATE_KEY))
                    .andExpect(jsonPath("$.template_params.to_email").value("jane@example.com"))
                    .andExpect(jsonPath("$.template_params.subject")
                            .value("Your NeighborNest verification code"))
                    .andExpect(jsonPath("$.template_params.otpCode").value("123456"))
                    .andExpect(jsonPath("$.template_params.expiryMinutes").value("10"))
                    .andRespond(withSuccess("OK", MediaType.TEXT_PLAIN));

            final Map<String, Object> variables = Map.of(
                    "otpCode", "123456",
                    "expiryMinutes", 10,
                    "appName", "NeighborNest",
                    "supportEmail", "support@neighbornest.com");

            final boolean ok = emailService.sendTemplate(
                    "jane@example.com",
                    "Your {{appName}} verification code",
                    "otp-verification",
                    variables);

            assertThat(ok).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("Should join member lists into readable text")
        void shouldJoinCollections() {
            server.expect(once(), requestTo(EMAILJS_URL))
                    .andExpect(jsonPath("$.template_params.members").value("Jane Doe, John Smith"))
                    .andRespond(withSuccess("OK", MediaType.TEXT_PLAIN));

            final Map<String, Object> variables = Map.of(
                    "members", List.of("Jane Doe", "John Smith"),
                    "city", "San Francisco");

            final boolean ok = emailService.sendTemplate(
                    "jane@example.com", "Welcome to {{nestName}}", "otp-verification", variables);

            assertThat(ok).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("Should fail soft when no template id is configured for the key")
        void shouldFailWhenTemplateMissing() {
            final boolean ok = emailService.sendTemplate(
                    "jane@example.com", "Subject", "unknown-key", Map.of());

            assertThat(ok).isFalse();
            server.verify();
        }

        @Test
        @DisplayName("Should fail soft when EmailJS is not configured")
        void shouldFailWhenNotConfigured() {
            properties.setPublicKey(null);

            final boolean ok = emailService.sendTemplate(
                    "jane@example.com", "Subject", "otp-verification", Map.of());

            assertThat(ok).isFalse();
            server.verify();
        }

        @Test
        @DisplayName("Should fail soft when the API rejects the send")
        void shouldFailWhenApiRejects() {
            server.expect(once(), requestTo(EMAILJS_URL))
                    .andRespond(withStatus(org.springframework.http.HttpStatus.BAD_REQUEST)
                            .body("The template_id parameter is required"));

            final boolean ok = emailService.sendTemplate(
                    "jane@example.com", "Subject", "otp-verification", Map.of());

            assertThat(ok).isFalse();
            server.verify();
        }

        @Test
        @DisplayName("Should refuse a missing recipient")
        void shouldRefuseMissingRecipient() {
            final boolean ok = emailService.sendTemplate(
                    null, "Subject", "otp-verification", Map.of());

            assertThat(ok).isFalse();
            server.verify();
        }
    }

    @Nested
    @DisplayName("sendRaw")
    class SendRawTests {

        @Test
        @DisplayName("Should send through the raw-email template")
        void shouldSendRaw() {
            properties.getTemplates().put("raw-email", "template_raw");

            server.expect(once(), requestTo(EMAILJS_URL))
                    .andExpect(jsonPath("$.template_id").value("template_raw"))
                    .andExpect(jsonPath("$.template_params.to_email").value("jane@example.com"))
                    .andExpect(jsonPath("$.template_params.subject").value("Urgent heads-up"))
                    .andExpect(jsonPath("$.template_params.title").value("Urgent heads-up"))
                    .andExpect(jsonPath("$.template_params.message").value("Please check the app."))
                    .andRespond(withSuccess("OK", MediaType.TEXT_PLAIN));

            final boolean ok = emailService.sendRaw(
                    "jane@example.com", "Urgent heads-up", "<html></html>", "Please check the app.");

            assertThat(ok).isTrue();
            server.verify();
        }

        @Test
        @DisplayName("Should fail soft when the raw template is not configured")
        void shouldFailWhenTemplateMissing() {
            final boolean ok = emailService.sendRaw(
                    "jane@example.com", "Subject", "<html></html>", "Body");

            assertThat(ok).isFalse();
            server.verify();
        }
    }
}
