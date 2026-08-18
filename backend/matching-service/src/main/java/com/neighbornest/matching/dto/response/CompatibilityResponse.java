package com.neighbornest.matching.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for a single compatibility score.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Compatibility score between two users")
public class CompatibilityResponse {

    @Schema(description = "User profile ID of the other user", example = "8")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Full name of the other user", example = "Jane Doe")
    @JsonProperty("full_name")
    private String fullName;

    @Schema(description = "City of the other user", example = "San Francisco")
    private String city;

    @Schema(description = "URL to the other user's profile photo", example = "https://storage.example.com/photos/user1.jpg")
    @JsonProperty("profile_photo_url")
    private String profilePhotoUrl;

    @Schema(description = "The other user's interests (from onboarding answers)", example = "[\"Hiking\", \"Cooking\"]")
    private List<String> interests;

    @Schema(description = "Overall compatibility score (0-100)", example = "87.50")
    @JsonProperty("overall_score")
    private BigDecimal overallScore;

    @Schema(description = "Values alignment score (0-100)", example = "90.00")
    @JsonProperty("values_score")
    private BigDecimal valuesScore;

    @Schema(description = "Lifestyle alignment score (0-100)", example = "85.00")
    @JsonProperty("lifestyle_score")
    private BigDecimal lifestyleScore;

    @Schema(description = "Interest overlap score (0-100)", example = "80.00")
    @JsonProperty("interest_score")
    private BigDecimal interestScore;
}
