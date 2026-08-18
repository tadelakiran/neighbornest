package com.neighbornest.notificationservice.service;

import com.neighbornest.notificationservice.config.EmailJsProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Sends transactional email through the EmailJS REST API.
 * <p>
 * EmailJS delivers via the email service configured in its dashboard (Gmail,
 * Elastic Email, SendGrid, ...) and renders the body from templates defined
 * there — so this service no longer renders Thymeleaf or talks SMTP. Each
 * {@code templateKey} maps to an EmailJS template id ({@code emailjs.templates});
 * the recipient is passed as the {@code to_email} parameter and the subject as
 * {@code subject} (set the template's Subject field to {@code {{subject}}}).
 * Delivery is reported as a boolean so callers can persist the notification
 * with a SENT/FAILED status; API failures are logged and never propagated (a
 * notification must not take down a RabbitMQ consumer).
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@Slf4j
public class EmailService {

    /** EmailJS REST endpoint for sending a templated email. */
    private static final String EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

    /** Template key used by {@link #sendRaw} (generic manual-email template). */
    static final String RAW_EMAIL_TEMPLATE_KEY = "raw-email";

    /** Template parameter carrying the recipient address. */
    private static final String PARAM_TO_EMAIL = "to_email";

    /** Template parameter carrying the subject line. */
    private static final String PARAM_SUBJECT = "subject";

    /**
     * EmailJS rejects header-less (non-browser-looking) HTTP clients with
     * "API access from non-browser environments is currently disabled" unless
     * that account toggle is enabled. Sending a browser Origin/Referer is the
     * supported workaround for server-to-server clients. Remove once the
     * account setting (Settings -> Security) is confirmed working.
     */
    private static final String ORIGIN_HEADER = "Origin";
    private static final String REFERER_HEADER = "Referer";
    private static final String ORIGIN_VALUE = "http://localhost:5173";

    private final EmailJsProperties emailJsProperties;
    private final RestClient restClient;

    /**
     * Creates the service and its HTTP client.
     *
     * @param emailJsProperties the EmailJS credentials + template mapping
     * @param builder           the shared RestClient builder
     */
    public EmailService(final EmailJsProperties emailJsProperties, final RestClient.Builder builder) {
        this.emailJsProperties = emailJsProperties;
        this.restClient = builder.build();
    }

    /**
     * Sends a template-based email to the recipient via EmailJS.
     *
     * @param to              the recipient email address (may be null)
     * @param subjectTemplate the subject with {{var}} placeholders
     * @param templateKey     the email template key
     * @param variables       the template variables
     * @return {@code true} if the email was sent, {@code false} otherwise
     */
    public boolean sendTemplate(final String to, final String subjectTemplate,
                                final String templateKey, final Map<String, Object> variables) {
        if (!StringUtils.hasText(to)) {
            log.warn("Email not sent: no recipient address available (template '{}')", templateKey);
            return false;
        }
        if (!StringUtils.hasText(templateKey)) {
            log.warn("Email not sent: missing template key");
            return false;
        }

        final String templateId = emailJsProperties.getTemplates().get(templateKey);
        if (!StringUtils.hasText(templateId)) {
            log.warn("No EmailJS template configured for key '{}'; email to {} not sent", templateKey, to);
            return false;
        }

        final Map<String, Object> safeVariables = variables == null ? Map.of() : variables;
        final Map<String, Object> params = stringify(safeVariables);
        params.put(PARAM_TO_EMAIL, to);
        params.put(PARAM_SUBJECT, applyPlaceholders(subjectTemplate, safeVariables));

        final boolean ok = sendEmailJs(templateId, params);
        if (ok) {
            log.info("Email sent to {} via EmailJS template '{}'", to, templateKey);
        } else {
            log.warn("Email to {} via EmailJS template '{}' failed", to, templateKey);
        }
        return ok;
    }

    /**
     * Sends a raw (non-template) email through the generic {@code raw-email}
     * EmailJS template. The rendered look is governed by that dashboard
     * template; {@code html} is kept for callers that log/compose it.
     *
     * @param to      the recipient email address (may be null)
     * @param subject the subject line
     * @param html    the HTML body (ignored — EmailJS renders the template)
     * @param text    the plain-text body (passed as the template's message)
     * @return {@code true} if the email was sent, {@code false} otherwise
     */
    public boolean sendRaw(final String to, final String subject, final String html, final String text) {
        if (!StringUtils.hasText(to)) {
            log.warn("Email not sent: no recipient address available");
            return false;
        }

        final String templateId = emailJsProperties.getTemplates().get(RAW_EMAIL_TEMPLATE_KEY);
        if (!StringUtils.hasText(templateId)) {
            log.warn("No EmailJS template configured for key '{}'; email to {} not sent",
                    RAW_EMAIL_TEMPLATE_KEY, to);
            return false;
        }

        final Map<String, Object> params = new LinkedHashMap<>();
        params.put(PARAM_TO_EMAIL, to);
        params.put(PARAM_SUBJECT, subject);
        params.put("title", subject);
        params.put("message", text == null ? html : text);

        final boolean ok = sendEmailJs(templateId, params);
        if (ok) {
            log.info("Raw email sent to {}", to);
        } else {
            log.warn("Raw email to {} failed", to);
        }
        return ok;
    }

    /**
     * Calls the EmailJS send endpoint. Fails soft: configuration gaps and API
     * errors are logged and reported as {@code false}.
     *
     * @param templateId     the EmailJS template id
     * @param templateParams the template parameters (must include to_email)
     * @return {@code true} if EmailJS accepted the send
     */
    private boolean sendEmailJs(final String templateId, final Map<String, Object> templateParams) {
        if (!StringUtils.hasText(emailJsProperties.getPublicKey())
                || !StringUtils.hasText(emailJsProperties.getServiceId())) {
            log.warn("EmailJS not configured (public key or service id missing); email not sent");
            return false;
        }

        final Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("service_id", emailJsProperties.getServiceId());
        payload.put("template_id", templateId);
        payload.put("user_id", emailJsProperties.getPublicKey());
        payload.put("accessToken", emailJsProperties.getPrivateKey());
        payload.put("template_params", templateParams);

        try {
            restClient.post()
                    .uri(EMAILJS_ENDPOINT)
                    .header(ORIGIN_HEADER, ORIGIN_VALUE)
                    .header(REFERER_HEADER, ORIGIN_VALUE + "/")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (final RestClientResponseException e) {
            // EmailJS answered with an error status; its body names exactly what
            // is misconfigured ("The template ID not found", "API access from
            // non-browser environments is currently disabled", bad key, ...).
            // Log it verbatim so the failure is diagnosable instead of a generic
            // "couldn't send".
            final String body = StringUtils.hasText(e.getResponseBodyAsString())
                    ? e.getResponseBodyAsString() : "(no response body)";
            log.error("EmailJS rejected the email (template '{}', HTTP {}): {}. "
                            + "Check the template id / service id / keys under 'emailjs:' in "
                            + "application.yml (see emailjs-templates/README.md).",
                    templateId, e.getStatusCode().value(), body);
            return false;
        } catch (final RestClientException e) {
            log.error("EmailJS request failed (template '{}', likely network/timeout): {}",
                    templateId, e.getMessage());
            return false;
        }
    }

    /**
     * Converts template variables to EmailJS params. Collections are joined
     * with {@code ", "} so member lists render as readable text.
     *
     * @param variables the raw variables
     * @return a string-keyed parameter map
     */
    private Map<String, Object> stringify(final Map<String, Object> variables) {
        final Map<String, Object> params = new HashMap<>(variables.size());
        variables.forEach((key, value) -> params.put(key, asString(value)));
        return params;
    }

    /**
     * Renders a value as a template-friendly string.
     *
     * @param value the value (may be null)
     * @return the string representation
     */
    private String asString(final Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof Collection<?> collection) {
            return String.join(", ", collection.stream()
                    .map(item -> item == null ? "" : String.valueOf(item))
                    .toList());
        }
        return String.valueOf(value);
    }

    /**
     * Replaces {@code {{key}}} placeholders in a text with the given variables.
     *
     * @param text      the text containing placeholders
     * @param variables the variables to substitute
     * @return the substituted text
     */
    private String applyPlaceholders(final String text, final Map<String, Object> variables) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        String result = text;
        for (final Map.Entry<String, Object> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", asString(entry.getValue()));
        }
        return result;
    }
}
