package com.neighbornest.nest.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for creating a Nest.
 * <p>
 * Primarily called by the matching-service via Feign once a proposal has
 * been fully accepted.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for creating a Nest")
public class CreateNestRequest {

    @NotBlank(message = "Nest name is required")
    @Size(max = 100, message = "Nest name must not exceed 100 characters")
    @Schema(description = "Name of the Nest", example = "Mission Mates", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    @Schema(description = "City where the Nest is based", example = "San Francisco", requiredMode = Schema.RequiredMode.REQUIRED)
    private String city;

    @NotEmpty(message = "At least one member is required")
    @Schema(description = "User profile IDs of the members", example = "[1, 2, 3]", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Long> memberUserIds;

    @Schema(description = "User profile IDs of the anchors", example = "[4]")
    private List<Long> anchorUserIds;
}
