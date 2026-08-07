package com.neighbornest.notificationservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for updating a user's notification preferences.
 * <p>
 * All fields are optional — only the fields that are present (non-null) are
 * applied, so clients can send partial updates.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Partial update of notification preferences")
public class UpdatePreferenceRequest {

    @Schema(description = "Master email channel toggle", example = "true")
    private Boolean emailEnabled;

    @Schema(description = "Master SMS channel toggle", example = "false")
    private Boolean smsEnabled;

    @Schema(description = "Master push channel toggle", example = "true")
    private Boolean pushEnabled;

    @Schema(description = "Meeting reminder category toggle", example = "true")
    private Boolean meetingReminders;

    @Schema(description = "Expense alert category toggle", example = "true")
    private Boolean expenseAlerts;

    @Schema(description = "Vibe check reminder category toggle", example = "true")
    private Boolean vibeCheckReminders;

    @Schema(description = "Chat notification category toggle", example = "true")
    private Boolean chatNotifications;
}
