package com.neighbornest.notificationservice.service;

import com.neighbornest.notificationservice.constants.AppConstants;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;

/**
 * Sends transactional email for the Notification Service.
 * <p>
 * Emails are composed as {@code multipart/alternative} (HTML + plain text)
 * and sent through the configured {@link JavaMailSender} (Mailtrap in dev,
 * Gmail/SendGrid in production). Delivery is reported as a boolean so callers
 * can persist the notification with a SENT/FAILED status; SMTP failures are
 * logged and never propagated (a notification must not take down a RabbitMQ
 * consumer).
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;
    private final TemplateService templateService;

    /**
     * Sends a template-based email to the recipient.
     *
     * @param to             the recipient email address (may be null)
     * @param subjectTemplate the subject with {{var}} placeholders
     * @param templateKey    the email template key
     * @param variables      the template variables
     * @return {@code true} if the email was sent, {@code false} otherwise
     */
    public boolean sendTemplate(final String to, final String subjectTemplate,
                                final String templateKey, final Map<String, Object> variables) {
        if (!StringUtils.hasText(to)) {
            log.warn("Email not sent: no recipient address available (template '{}')", templateKey);
            return false;
        }

        try {
            final String html = templateService.renderHtml(templateKey, variables);
            if (html == null) {
                log.warn("Email not sent: failed to render template '{}'", templateKey);
                return false;
            }
            final String text = templateService.renderText(templateKey, variables);
            final String subject = templateService.replacePlaceholders(subjectTemplate, variables);
            sendMime(to, subject, html, text == null ? html : text);
            log.info("Email sent to {} using template '{}'", to, templateKey);
            return true;
        } catch (final MailException | MessagingException e) {
            log.error("Email to {} using template '{}' failed: {}", to, templateKey, e.getMessage());
            return false;
        }
    }

    /**
     * Sends a raw (non-template) email.
     *
     * @param to      the recipient email address (may be null)
     * @param subject the subject line
     * @param html    the HTML body
     * @param text    the plain-text body
     * @return {@code true} if the email was sent, {@code false} otherwise
     */
    public boolean sendRaw(final String to, final String subject, final String html, final String text) {
        if (!StringUtils.hasText(to)) {
            log.warn("Email not sent: no recipient address available");
            return false;
        }
        try {
            sendMime(to, subject, html, text);
            log.info("Raw email sent to {}", to);
            return true;
        } catch (final MailException | MessagingException e) {
            log.error("Raw email to {} failed: {}", to, e.getMessage());
            return false;
        }
    }

    /**
     * Composes and sends a multipart/alternative message.
     *
     * @param to      the recipient
     * @param subject the subject
     * @param html    the HTML body
     * @param text    the plain-text body
     * @throws MessagingException if composition fails
     */
    private void sendMime(final String to, final String subject, final String html, final String text)
            throws MessagingException {
        final MimeMessage message = javaMailSender.createMimeMessage();
        final MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(AppConstants.EMAIL_FROM);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(text, html);
        javaMailSender.send(message);
    }
}
