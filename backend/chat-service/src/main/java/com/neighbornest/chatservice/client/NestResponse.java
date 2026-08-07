package com.neighbornest.chatservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * External DTO mirroring the nest-service {@code NestResponse} payload.
 * <p>
 * The nest-service embeds the member list in the Nest response, so membership
 * checks read {@link #getMembers()} directly.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NestResponse {

    /** Nest id. */
    private Long id;

    /** Name of the Nest. */
    private String name;

    /** City where the Nest is based. */
    private String city;

    /** Current Nest status (ACTIVE / GRADUATED / ...). */
    private String status;

    /** Start date of the Nest. */
    @JsonProperty("start_date")
    private LocalDate startDate;

    /** End date of the Nest. */
    @JsonProperty("end_date")
    private LocalDate endDate;

    /** Members of the Nest. */
    private List<NestMemberResponse> members;

    /** Timestamp when the Nest was created. */
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
