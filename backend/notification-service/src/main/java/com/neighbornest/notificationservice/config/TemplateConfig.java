package com.neighbornest.notificationservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.StringTemplateResolver;

/**
 * Thymeleaf template engine configuration.
 * <p>
 * The classpath engine (Spring Boot's auto-configured
 * {@code springTemplateEngine}) renders the built-in templates under
 * {@code classpath:/templates/}. This configuration adds a second engine that
 * renders template <em>strings</em>, used for admin-managed templates stored
 * in the database.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
public class TemplateConfig {

    /**
     * Creates a Thymeleaf engine that renders inline template strings (used
     * for database-stored email templates).
     *
     * @return the string-capable template engine
     */
    @Bean(name = "stringTemplateEngine")
    public SpringTemplateEngine stringTemplateEngine() {
        final SpringTemplateEngine engine = new SpringTemplateEngine();
        final StringTemplateResolver resolver = new StringTemplateResolver();
        resolver.setTemplateMode(TemplateMode.HTML);
        engine.setTemplateResolver(resolver);
        return engine;
    }
}
