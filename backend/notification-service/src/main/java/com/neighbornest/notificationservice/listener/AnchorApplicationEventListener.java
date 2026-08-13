package com.neighbornest.notificationservice.listener;

import com.neighbornest.notificationservice.enums.NotificationType;
import com.neighbornest.notificationservice.event.AnchorApplicationReviewedEvent;
import com.neighbornest.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumes {@code user.anchor.reviewed} events and notifies the applicant.
 * <p>
 * The user-service publishes one event per admin review of an Anchor
 * application; this listener creates an in-app notification for the applicant
 * telling them whether they were approved (role upgraded to ANCHOR) or
 * rejected. Missing recipient ids are skipped with a warning.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AnchorApplicationEventListener {

    private final NotificationService notificationService;

    /** Related-entity marker used for anchor application notifications. */
    private static final String RELATED_ENTITY_PROFILE = "USER_PROFILE";

    /**
     * Handles an anchor application review event: stores an in-app
     * notification for the applicant.
     *
     * @param event the review event
     */
    @RabbitListener(queues = "${app.notification.events.anchor-queue}")
    public void handleAnchorApplicationReviewed(final AnchorApplicationReviewedEvent event) {
        log.info("Received user.anchor.reviewed event for application {} (decision {})",
                event.applicationId(), event.decision());

        if (event.applicantProfileId() == null) {
            log.warn("Anchor review event for application {} carried no applicant id; skipping",
                    event.applicationId());
            return;
        }

        final boolean approved = "APPROVE".equals(event.decision());
        final String title = approved
                ? "Your Anchor application was approved!"
                : "Your Anchor application was not approved";
        final String body = approved
                ? "Congratulations" + greeting(event.applicantName()) + " — your role has been upgraded to Anchor. You can now host newcomers and guide your own Nest."
                : "Your Anchor application was reviewed and not approved at this time." + noteSuffix(event.note());

        try {
            notificationService.dispatchInApp(
                    event.applicantProfileId(),
                    NotificationType.ANCHOR_APPLICATION,
                    title,
                    body,
                    RELATED_ENTITY_PROFILE,
                    event.applicantProfileId());
        } catch (final Exception e) {
            // Per-recipient isolation: one failing inbox row must not stop anything else.
            log.warn("Could not create anchor-application notification for user {}",
                    event.applicantProfileId(), e);
        }
    }

    /**
     * Builds the name greeting suffix ("Meera!" or "!" when unknown).
     *
     * @param name the applicant's full name (may be null)
     * @return the greeting suffix
     */
    private String greeting(final String name) {
        if (name == null || name.isBlank()) {
            return "!";
        }
        final String first = name.trim().split("\\s+")[0];
        return ", " + first + "!";
    }

    /**
     * Builds the optional reviewer-note suffix for rejection messages.
     *
     * @param note the reviewer note (may be null)
     * @return the suffix, or an empty string
     */
    private String noteSuffix(final String note) {
        if (note == null || note.isBlank()) {
            return " You can re-apply later.";
        }
        return " Review note: " + note;
    }
}
