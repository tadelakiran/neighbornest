package com.neighbornest.notificationservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * External DTO mirroring the nest-service {@code VibeCheckStatusResponse}
 * payload fields the scheduler needs for vibe check reminders.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VibeCheckStatusResponse {

    /** Number of submissions received. */
    @JsonProperty("submission_count")
    private long submissionCount;

    /** Individual submissions, used to determine who has not submitted yet. */
    private List<VibeCheckResponse> submissions;
}
