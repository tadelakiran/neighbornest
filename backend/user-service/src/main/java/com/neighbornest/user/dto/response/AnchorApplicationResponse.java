package com.neighbornest.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.user.entity.AnchorStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for an anchor application.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Anchor application data")
public class AnchorApplicationResponse {

    @Schema(description = "Application ID", example = "1")
    private Long id;

    @Schema(description = "Linked user profile ID", example = "7")
    @JsonProperty("user_profile_id")
    private Long userProfileId;

    @Schema(description = "Applicant's full name (populated for admin review views)", example = "John Doe")
    @JsonProperty("full_name")
    private String fullName;

    @Schema(description = "Years the applicant has lived in the city", example = "5")
    @JsonProperty("years_in_city")
    private int yearsInCity;

    @Schema(description = "Neighborhoods the applicant knows well", example = "Mission, Noe Valley")
    @JsonProperty("neighborhoods_known")
    private String neighborhoodsKnown;

    @Schema(description = "Languages the applicant speaks", example = "English, Spanish")
    @JsonProperty("languages_spoken")
    private String languagesSpoken;

    @Schema(description = "Relevant local experience", example = "Ran a local book club for 3 years")
    private String experience;

    @Schema(description = "Weekly availability", example = "Evenings and weekends")
    private String availability;

    @Schema(description = "Review status", example = "PENDING")
    private AnchorStatus status;

    @Schema(description = "Timestamp when the application was submitted", example = "2025-01-15T10:30:00")
    @JsonProperty("applied_at")
    private LocalDateTime appliedAt;

    @Schema(description = "Timestamp when the application was reviewed", example = "2025-01-18T10:30:00")
    @JsonProperty("reviewed_at")
    private LocalDateTime reviewedAt;

    @Schema(description = "Note left by the reviewer", example = "Strong local knowledge and availability")
    @JsonProperty("review_note")
    private String reviewNote;
}
