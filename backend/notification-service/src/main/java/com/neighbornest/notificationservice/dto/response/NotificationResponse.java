package com.neighbornest.notificationservice.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.neighbornest.notificationservice.enums.NotificationChannel;
import com.neighbornest.notificationservice.enums.NotificationStatus;
import com.neighbornest.notificationservice.enums.NotificationType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a single notification as shown in the user's inbox.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "A notification in the user's inbox")
public class NotificationResponse {

    @Schema(description = "Notification id", example = "101")
    private Long id;

    @Schema(description = "Recipient's user-service profile id", example = "7")
    @JsonProperty("user_id")
    private Long userId;

    @Schema(description = "Notification category", example = "NEST_CREATED")
    private NotificationType type;

    @Schema(description = "Short headline", example = "Welcome to Mission Mates!")
    private String title;

    @Schema(description = "Full notification body")
    private String message;

    @Schema(description = "Delivery channel", example = "EMAIL")
    private NotificationChannel channel;

    @Schema(description = "Dispatch status", example = "SENT")
    private NotificationStatus status;

    @Schema(description = "Type of the related entity", example = "NEST")
    @JsonProperty("related_entity_type")
    private String relatedEntityType;

    @Schema(description = "Id of the related entity", example = "3")
    @JsonProperty("related_entity_id")
    private Long relatedEntityId;

    @Schema(description = "Timestamp when the notification was dispatched", example = "2025-01-15T10:30:00")
    @JsonProperty("sent_at")
    private LocalDateTime sentAt;

    @Schema(description = "Timestamp when the user read the notification")
    @JsonProperty("read_at")
    private LocalDateTime readAt;

    @Schema(description = "Timestamp when the notification was created", example = "2025-01-15T10:30:00")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
