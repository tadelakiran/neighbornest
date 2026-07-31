package com.neighbornest.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for applying to become a local Anchor.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for submitting an anchor application")
public class AnchorApplyRequest {

    @NotNull(message = "Years in city is required")
    @Min(value = 1, message = "You must have lived in the city for at least 1 year")
    @Schema(description = "Years the applicant has lived in the city", example = "5", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer yearsInCity;

    @NotBlank(message = "Neighborhoods known is required")
    @Size(max = 2000, message = "Neighborhoods known must not exceed 2000 characters")
    @Schema(description = "Neighborhoods the applicant knows well", example = "Mission, Noe Valley, Castro", requiredMode = Schema.RequiredMode.REQUIRED)
    private String neighborhoodsKnown;

    @Size(max = 500, message = "Languages spoken must not exceed 500 characters")
    @Schema(description = "Languages the applicant speaks", example = "English, Spanish")
    private String languagesSpoken;

    @NotBlank(message = "Experience is required")
    @Size(max = 2000, message = "Experience must not exceed 2000 characters")
    @Schema(description = "Relevant local experience or context", example = "Ran a local book club for 3 years", requiredMode = Schema.RequiredMode.REQUIRED)
    private String experience;

    @Size(max = 500, message = "Availability must not exceed 500 characters")
    @Schema(description = "Weekly availability as an anchor", example = "Evenings and weekends")
    private String availability;
}
