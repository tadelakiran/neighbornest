package com.neighbornest.notificationservice.event;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Event DTO mirroring the {@code AnchorApplicationReviewedEvent} published by
 * the user-service on the shared {@code nest.events} exchange (routing key
 * {@code user.anchor.reviewed}). Field names match the user-service record so
 * the JSON message converter deserializes the payload losslessly.
 *
 * @param applicationId      the reviewed application id
 * @param applicantProfileId the applicant's user-service profile id (recipient)
 * @param applicantName      the applicant's full name (may be {@code null})
 * @param decision           {@code APPROVE} or {@code REJECT}
 * @param note               the optional reviewer note (may be {@code null})
 * @param reviewedAt         when the review happened
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
