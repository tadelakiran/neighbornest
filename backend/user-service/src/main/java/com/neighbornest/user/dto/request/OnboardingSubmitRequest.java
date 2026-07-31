package com.neighbornest.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for submitting the complete onboarding questionnaire.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for submitting onboarding answers")
public class OnboardingSubmitRequest {

    @Valid
    @NotEmpty(message = "At least one onboarding answer is required")
    @Schema(description = "List of question answers", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<OnboardingAnswerRequest> answers;
}
