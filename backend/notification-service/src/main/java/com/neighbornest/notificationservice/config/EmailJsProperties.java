package com.neighbornest.notificationservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Type-safe configuration properties under the {@code emailjs} prefix.
 * <p>
 * Holds the credentials for the EmailJS REST API (public/private keys and the
 * default service id) plus the mapping from this service's {@code templateKey}s
 * to the template ids defined in the EmailJS dashboard.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@ConfigurationProperties(prefix = "emailjs")
public class EmailJsProperties {

    /** EmailJS account public key. */
    private String publicKey;

    /** EmailJS account private key (server-side only, never shipped to the browser). */
    private String privateKey;

    /** EmailJS service id of the email service used for delivery. */
    private String serviceId;

    /** Maps this service's template keys to EmailJS dashboard template ids. */
    private Map<String, String> templates = new LinkedHashMap<>();
}
