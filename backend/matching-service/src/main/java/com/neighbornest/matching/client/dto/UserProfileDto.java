package com.neighbornest.matching.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight external DTO carrying a user's profile summary, used to enrich
 * compatibility responses with the user's name and city.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {

    /** User profile ID. */
    private Long id;

    /** User's full name. */
    @JsonProperty("full_name")
    private String fullName;

    /** User's city. */
    private String city;
}
