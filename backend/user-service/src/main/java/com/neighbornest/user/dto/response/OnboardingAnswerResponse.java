package com.neighbornest.user.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for a single onboarding answer.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A stored onboarding answer")
public class OnboardingAnswerResponse {

    @Schema(description = "Unique key identifying the question", example = "values_adventure")
    private String questionKey;

    @Schema(description = "User's answer to the question", example = "5")
    private String answerValue;

    @Schema(description = "Importance weight of this question for matching (1-5)", example = "3")
    private Integer weight;
}
