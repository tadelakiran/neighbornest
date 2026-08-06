package com.neighbornest.matching.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External DTO mirroring the nest-service {@code NestResponse} payload so the
 * matching-service can capture the {@code nestId} after Nest creation.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NestResponseDto {

    /** The ID of the created Nest. */
    private Long id;

    /** Name of the created Nest. */
    private String name;

    /** City where the Nest is based. */
    private String city;
}
