package com.neighbornest.matching.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * External DTO sent to the nest-service to create a Nest from an accepted
 * proposal. Mirrors the nest-service {@code CreateNestRequest} payload.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNestRequest {

    /** Suggested name for the Nest. */
    private String name;

    /** City where the Nest is based. */
    private String city;

    /** User profile IDs of the members. */
    private List<Long> memberUserIds;

    /** User profile IDs of the anchors. */
    private List<Long> anchorUserIds;
}
