package com.neighbornest.matching.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External DTO mirroring the onboarding answer payload returned by the
 * user-service. Used by the matching engine to compute interest and values
 * overlap scores.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingAnswerDto {

    /** Question key, e.g. {@code values_adventure}. */
    private String questionKey;

    /** The stored answer value. */
    private String answerValue;

    /** Importance weight of the question (1-5). */
    private Integer weight;
}
