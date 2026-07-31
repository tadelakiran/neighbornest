package com.neighbornest.nest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.nest.entity.NestStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a Nest including its members.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Nest data with members")
public class NestResponse {

    @Schema(description = "Nest ID", example = "1")
    private Long id;

    @Schema(description = "Name of the Nest", example = "Mission Mates")
    private String name;

    @Schema(description = "City where the Nest is based", example = "San Francisco")
    private String city;

    @Schema(description = "Current Nest status", example = "ACTIVE")
    private NestStatus status;

    @Schema(description = "Start date of the Nest", example = "2025-02-01")
    @JsonProperty("start_date")
    private LocalDate startDate;

    @Schema(description = "End date of the Nest", example = "2025-08-01")
    @JsonProperty("end_date")
    private LocalDate endDate;

    @Schema(description = "Members of the Nest")
    private List<NestMemberResponse> members;

    @Schema(description = "Timestamp when the Nest was created", example = "2025-01-15T10:30:00")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
