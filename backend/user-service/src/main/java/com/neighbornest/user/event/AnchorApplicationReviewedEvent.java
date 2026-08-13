package com.neighbornest.user.event;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Event published to RabbitMQ when an admin reviews an Anchor application.
 * <p>
 * Published on the shared {@code nest.events} topic exchange with the
 * {@code user.anchor.reviewed} routing key after the review transaction
 * commits. The notification-service consumes it and creates an in-app
 * notification for the applicant so they learn the verdict without
 * re-checking their profile page.
 * </p>
 *
 * @param applicationId     the reviewed application id
 * @param applicantProfileId the applicant's user-service profile id (recipient)
 * @param applicantName     the applicant's full name (may be {@code null})
 * @param decision          {@code APPROVE} or {@code REJECT}
 * @param note              the optional reviewer note (may be {@code null})
 * @param reviewedAt        when the review happened
 */
public record AnchorApplicationReviewedEvent(
        Long applicationId,
        Long applicantProfileId,
        String applicantName,
        String decision,
        String note,
        LocalDateTime reviewedAt
) implements Serializable {
}
