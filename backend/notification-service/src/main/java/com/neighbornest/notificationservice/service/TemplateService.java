package com.neighbornest.notificationservice.service;

import com.neighbornest.notificationservice.entity.EmailTemplate;
import com.neighbornest.notificationservice.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Locale;
import java.util.Map;

/**
 * Renders email templates for the Notification Service.
 * <p>
 * Resolution order: if an admin-managed template exists in the database for
 * the requested {@code templateKey}, its body is rendered (HTML through the
 * string template engine, plain text through {{var}} replacement); otherwise
 * the built-in classpath template ({@code classpath:/templates/{key}.html})
 * is rendered with Thymeleaf and the plain-text fallback is derived by
 * stripping the HTML tags.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateService {

    private final EmailTemplateRepository emailTemplateRepository;

    @Qualifier("springTemplateEngine")
    private final SpringTemplateEngine classpathTemplateEngine;

    @Qualifier("stringTemplateEngine")
    private final SpringTemplateEngine stringTemplateEngine;

    /** Matches HTML tags so they can be stripped for plain-text fallbacks. */
    private static final String HTML_TAG_PATTERN = "<[^>]+>";

    /**
     * Renders the HTML body for a template key with the given variables.
     *
     * @param templateKey the template key
     * @param variables   the template variables
     * @return the rendered HTML, or {@code null} if rendering failed
     */
    public String renderHtml(final String templateKey, final Map<String, Object> variables) {
        final Context context = new Context(Locale.ENGLISH, variables);

        final EmailTemplate dbTemplate = emailTemplateRepository.findByTemplateKey(templateKey).orElse(null);
        if (dbTemplate != null && StringUtils.hasText(dbTemplate.getBodyHtml())) {
            return stringTemplateEngine.process(dbTemplate.getBodyHtml(), context);
        }

        try {
            return classpathTemplateEngine.process(templateKey, context);
        } catch (final Exception e) {
            log.error("Failed to render classpath template '{}'", templateKey, e);
            return null;
        }
    }

    /**
     * Renders the plain-text fallback for a template key. Database templates
     * use their stored body with {{var}} replacement; classpath templates
     * derive the text from the rendered HTML.
     *
     * @param templateKey the template key
     * @param variables   the template variables
     * @return the plain-text body, or {@code null} if it could not be derived
     */
    public String renderText(final String templateKey, final Map<String, Object> variables) {
        final EmailTemplate dbTemplate = emailTemplateRepository.findByTemplateKey(templateKey).orElse(null);
        if (dbTemplate != null && StringUtils.hasText(dbTemplate.getBodyText())) {
            return replacePlaceholders(dbTemplate.getBodyText(), variables);
        }

        final String html = renderHtml(templateKey, variables);
        return html == null ? null : stripTags(html);
    }

    /**
     * Replaces {@code {{key}}} placeholders in a text with the given variables.
     *
     * @param text      the text containing placeholders
     * @param variables the variables to substitute
     * @return the substituted text
     */
    public String replacePlaceholders(final String text, final Map<String, Object> variables) {
        String result = text;
        for (final Map.Entry<String, Object> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", String.valueOf(entry.getValue()));
        }
        return result;
    }

    /**
     * Strips HTML tags and collapses whitespace for plain-text fallbacks.
     *
     * @param html the rendered HTML
     * @return a plain-text approximation
     */
    private String stripTags(final String html) {
        return html.replaceAll(HTML_TAG_PATTERN, " ").replaceAll("\\s+", " ").trim();
    }
}
