package com.neighbornest.notificationservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Admin-managed email template registry.
 * <p>
 * Templates are keyed by {@code templateKey} (e.g. {@code nest-welcome}).
 * When a template with the same key exists, it overrides the built-in
 * classpath template of the same name when rendering event-driven emails.
 * {@code variables} holds an optional JSON schema describing the expected
 * template variables.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "email_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplate {

    /** Primary key, auto-generated. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique template identifier, e.g. "nest-welcome". */
    @Column(name = "template_key", nullable = false, unique = true, length = 50)
    private String templateKey;

    /** Email subject line. */
    @Column(nullable = false, length = 200)
    private String subject;

    /** HTML body (Thymeleaf syntax). */
    @Column(name = "body_html", nullable = false, columnDefinition = "TEXT")
    private String bodyHtml;

    /** Plain-text fallback body ({{var}} placeholders supported). */
    @Column(name = "body_text", nullable = false, columnDefinition = "TEXT")
    private String bodyText;

    /** Optional JSON schema of the expected variables. */
    @Column(columnDefinition = "TEXT")
    private String variables;

    /** Timestamp when the template was created. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Timestamp when the template was last updated. */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Assigns timestamps before the first persist.
     */
    @PrePersist
    void onCreate() {
        final LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    /**
     * Refreshes the update timestamp before each update.
     */
    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
