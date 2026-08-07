package com.neighbornest.notificationservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * SMTP configuration for the Notification Service.
 * <p>
 * Builds the {@link JavaMailSender} from the {@code spring.mail.*} properties
 * (Mailtrap for development, Gmail/SendGrid for production). The bean
 * overrides Spring Boot's auto-configured sender (which is conditional on a
 * missing bean) so the connection settings are explicit and predictable.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
public class MailConfig {

    /**
     * Creates the JavaMailSender from configuration properties.
     *
     * @param host         the SMTP host
     * @param port         the SMTP port
     * @param username     the SMTP username (may be empty in dev)
     * @param password     the SMTP password (may be empty in dev)
     * @param protocol     the transport protocol
     * @param smtpAuth     whether SMTP authentication is required
     * @param startTls     whether STARTTLS is enabled
     * @param defaultEncoding the message encoding
     * @return the configured sender
     */
    @Bean
    public JavaMailSender javaMailSender(
            @Value("${spring.mail.host}") final String host,
            @Value("${spring.mail.port}") final int port,
            @Value("${spring.mail.username:}") final String username,
            @Value("${spring.mail.password:}") final String password,
            @Value("${spring.mail.protocol:smtp}") final String protocol,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") final boolean smtpAuth,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") final boolean startTls,
            @Value("${spring.mail.default-encoding:UTF-8}") final String defaultEncoding) {

        final JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);
        sender.setProtocol(protocol);
        sender.setDefaultEncoding(defaultEncoding);

        final Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", protocol);
        props.put("mail.smtp.auth", String.valueOf(smtpAuth));
        props.put("mail.smtp.starttls.enable", String.valueOf(startTls));
        return sender;
    }
}
