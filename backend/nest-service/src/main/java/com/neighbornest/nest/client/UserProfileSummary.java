package com.neighbornest.nest.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External DTO mirroring the public profile payload returned by the
 * user-service. Used to enrich Nest member responses with display names.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileSummary {

    /** Profile ID in the user-service. */
    private Long id;

    /** User's full name. */
    @JsonProperty("full_name")
    private String fullName;
}
