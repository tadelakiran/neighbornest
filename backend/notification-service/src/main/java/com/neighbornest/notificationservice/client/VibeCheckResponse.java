package com.neighbornest.notificationservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External DTO mirroring the nest-service {@code VibeCheckResponse} payload
 * fields the scheduler needs to determine which members have not submitted a
 * vibe check.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VibeCheckResponse {

    /** User profile id who submitted the check. */
    @JsonProperty("user_id")
    private Long userId;
}
