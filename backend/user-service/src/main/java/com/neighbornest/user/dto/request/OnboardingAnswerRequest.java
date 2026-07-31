package com.neighbornest.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for a single onboarding answer.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A single onboarding question answer")
public class OnboardingAnswerRequest {

    @NotBlank(message = "Question key is required")
    @Size(max = 64, message = "Question key must not exceed 64 characters")
    @Schema(description = "Unique key identifying the question", example = "values_adventure", requiredMode = Schema.RequiredMode.REQUIRED)
    private String questionKey;

    @NotBlank(message = "Answer value is required")
    @Size(max = 500, message = "Answer value must not exceed 500 characters")
    @Schema(description = "User's answer to the question", example = "5", requiredMode = Schema.RequiredMode.REQUIRED)
    private String answerValue;

    @NotNull(message = "Weight is required")
    @Min(value = 1, message = "Weight must be at least 1")
    @Max(value = 5, message = "Weight must be at most 5")
    @Schema(description = "Importance weight of this question for matching (1-5)", example = "3")
    private Integer weight;
}
