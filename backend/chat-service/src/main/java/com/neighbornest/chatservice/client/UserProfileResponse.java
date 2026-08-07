package com.neighbornest.chatservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External DTO mirroring the fields of the user-service public profile payload
 * ({@code GET /api/users/{userId}/profile}) that chat needs for enrichment.
 * Unknown fields from the full profile response are ignored by Jackson.
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

    /** URL to the user's profile photo. */
    @JsonProperty("profile_photo_url")
    private String profilePhotoUrl;
}
