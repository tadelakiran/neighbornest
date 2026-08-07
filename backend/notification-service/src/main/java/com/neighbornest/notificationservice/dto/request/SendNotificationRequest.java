package com.neighbornest.notificationservice.dto.request;

import com.neighbornest.notificationservice.enums.NotificationChannel;
import com.neighbornest.notificationservice.enums.NotificationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for the admin-only manual notification send endpoint.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Admin request to manually trigger a notification")
public class SendNotificationRequest {

    @NotNull(message = "userId is required")
    @Positive(message = "userId must be a positive number")
    @Schema(description = "Recipient's user-service profile id", example = "7")
    private Long userId;

    @NotNull(message = "type is required")
    @Schema(description = "Notification category", example = "SYSTEM")
    private NotificationType type;

    @NotBlank(message = "title is required")
    @Size(max = 150, message = "title must not exceed 150 characters")
    @Schema(description = "Short headline", example = "Nest update")
    private String title;

    @NotBlank(message = "message is required")
    @Schema(description = "Full notification body", example = "Your Nest meeting moved to Friday.")
    private String message;

    @NotNull(message = "channel is required")
    @Schema(description = "Delivery channel", example = "EMAIL")
    private NotificationChannel channel;

    @Size(max = 50, message = "relatedEntityType must not exceed 50 characters")
    @Schema(description = "Type of the related entity, e.g. NEST", example = "NEST")
    private String relatedEntityType;

    @Schema(description = "Id of the related entity", example = "3")
    private Long relatedEntityId;
}
