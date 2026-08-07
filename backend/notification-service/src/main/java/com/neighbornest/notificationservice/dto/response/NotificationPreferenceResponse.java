package com.neighbornest.notificationservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for a user's notification preferences.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A user's notification preferences")
public class NotificationPreferenceResponse {

    @Schema(description = "User-service profile id", example = "7")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Master email channel toggle", example = "true")
    @JsonProperty("email_enabled")
    private boolean emailEnabled;

    @Schema(description = "Master SMS channel toggle", example = "false")
    @JsonProperty("sms_enabled")
    private boolean smsEnabled;

    @Schema(description = "Master push channel toggle", example = "true")
    @JsonProperty("push_enabled")
    private boolean pushEnabled;

    @Schema(description = "Meeting reminder category toggle", example = "true")
    @JsonProperty("meeting_reminders")
    private boolean meetingReminders;

    @Schema(description = "Expense alert category toggle", example = "true")
    @JsonProperty("expense_alerts")
    private boolean expenseAlerts;

    @Schema(description = "Vibe check reminder category toggle", example = "true")
    @JsonProperty("vibe_check_reminders")
    private boolean vibeCheckReminders;

    @Schema(description = "Chat notification category toggle", example = "true")
    @JsonProperty("chat_notifications")
    private boolean chatNotifications;
}
