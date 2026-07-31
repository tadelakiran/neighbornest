package com.neighbornest.user.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO reporting whether the user has completed onboarding.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Onboarding completion status")
public class OnboardingStatusResponse {

    @Schema(description = "Whether the user has completed onboarding", example = "true")
    private boolean isOnboarded;

    @Schema(description = "Number of answers recorded", example = "12")
    private long answerCount;
}
