package com.neighbornest.matching.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight external DTO carrying just a user's city, consumed when the
 * matching-service resolves the city for a new Nest.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCityDto {

    /** The user's city (may be null if the user has not set one). */
    private String city;
}
