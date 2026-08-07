package com.neighbornest.notificationservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External DTO mirroring the user-service public profile payload
 * ({@code GET /api/users/{userId}/profile}) plus the contact fields
 * notification delivery needs.
 * <p>
 * <strong>Note:</strong> the user-service public profile currently exposes
 * {@code id}, {@code full_name} and {@code role} only — {@code email} and
 * {@code phone} are not yet returned by the profile endpoint, so they arrive
 * as {@code null} until the user-service adds them. The notification service
 * degrades gracefully (marks the dispatch FAILED) when the email is missing.
 * Unknown fields from the full profile response are ignored by Jackson.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    /** User-service profile id. */
    private Long id;

    /** User's full name. */
    @JsonProperty("full_name")
    private String fullName;

    /** User's email address (null until user-service exposes it). */
    private String email;

    /** User's phone number (null until user-service exposes it). */
    private String phone;

    /** Platform role of the user (ADMIN / NEWCOMER / ...). */
    private String role;
}
