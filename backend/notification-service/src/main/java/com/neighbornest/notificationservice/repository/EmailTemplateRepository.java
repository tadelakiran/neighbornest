package com.neighbornest.notificationservice.repository;

import com.neighbornest.notificationservice.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link EmailTemplate}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    /**
     * Finds a template by its unique key.
     *
     * @param templateKey the template key
     * @return the template if it exists
     */
    Optional<EmailTemplate> findByTemplateKey(String templateKey);

    /**
     * Returns whether a template with the key already exists.
     *
     * @param templateKey the template key
     * @return {@code true} if it exists
     */
    boolean existsByTemplateKey(String templateKey);
}
