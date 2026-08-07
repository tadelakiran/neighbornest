package com.neighbornest.notificationservice.controller;

import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.dto.request.CreateTemplateRequest;
import com.neighbornest.notificationservice.dto.request.SendNotificationRequest;
import com.neighbornest.notificationservice.dto.request.UpdatePreferenceRequest;
import com.neighbornest.notificationservice.dto.response.EmailTemplateResponse;
import com.neighbornest.notificationservice.dto.response.NotificationCountResponse;
import com.neighbornest.notificationservice.dto.response.NotificationPreferenceResponse;
import com.neighbornest.notificationservice.dto.response.NotificationResponse;
import com.neighbornest.notificationservice.dto.response.NotificationStatsResponse;
import com.neighbornest.notificationservice.service.NotificationService;
import com.neighbornest.notificationservice.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for the notification domain.
 * <p>
 * User-facing endpoints ({@code /me}, preferences) resolve the caller through
 * {@link UserContext}; admin endpoints (manual send, stats, template creation)
 * additionally require the {@code ADMIN} role via {@code @PreAuthorize}.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
@RequestMapping(value = "/api/notifications", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notifications", description = "User inbox, preferences and admin notification endpoints")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserContext userContext;

    /**
     * Returns the caller's notification inbox page, newest first.
     *
     * @param page the page index (zero-based)
     * @param size the page size (capped at {@link AppConstants#MAX_PAGE_SIZE})
     * @return the inbox page
     */
    @GetMapping("/me")
    @Operation(summary = "Get my notifications",
            description = "Returns the caller's notifications, newest first, with pagination.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notifications retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "User profile could not be resolved")
    })
    public Page<NotificationResponse> getMyNotifications(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE_STRING) final int size) {
        // Clamp both bounds: negative/zero page sizes would throw from
        // PageRequest (surfacing as a 500) instead of a clean 400.
        final int safeSize = Math.max(1, Math.min(size, AppConstants.MAX_PAGE_SIZE));
        final Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);
        return notificationService.getForUser(userContext.requireProfileId(), pageable);
    }

    /**
     * Returns the caller's notification counts.
     *
     * @return the total / unread / read counts
     */
    @GetMapping("/me/unread-count")
    @Operation(summary = "Get unread count",
            description = "Returns the caller's total, unread and read notification counts.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Counts retrieved successfully")
    })
    public NotificationCountResponse getUnreadCount() {
        return notificationService.getUnreadCount(userContext.requireProfileId());
    }

    /**
     * Marks one of the caller's notifications as read.
     *
     * @param notificationId the notification id
     * @return the updated notification
     */
    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark notification as read",
            description = "Marks one of the caller's notifications as read and returns it.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification marked as read"),
            @ApiResponse(responseCode = "404", description = "Notification not found")
    })
    public NotificationResponse markRead(@PathVariable("notificationId") final Long notificationId) {
        return notificationService.markRead(userContext.requireProfileId(), notificationId);
    }

    /**
     * Marks all of the caller's notifications as read.
     *
     * @return the updated counts
     */
    @PutMapping("/me/read-all")
    @Operation(summary = "Mark all as read",
            description = "Marks all of the caller's notifications as read and returns the updated counts.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All notifications marked as read")
    })
    public NotificationCountResponse markAllRead() {
        return notificationService.markAllRead(userContext.requireProfileId());
    }

    /**
     * Returns the caller's notification preferences.
     *
     * @return the preferences
     */
    @GetMapping("/me/preferences")
    @Operation(summary = "Get my preferences",
            description = "Returns the caller's notification preferences (defaults created on first read).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preferences retrieved successfully")
    })
    public NotificationPreferenceResponse getPreferences() {
        return notificationService.getPreferences(userContext.requireProfileId());
    }

    /**
     * Updates the caller's notification preferences (partial update).
     *
     * @param request the preference update
     * @return the updated preferences
     */
    @PutMapping("/me/preferences")
    @Operation(summary = "Update my preferences",
            description = "Partially updates the caller's notification preferences; null fields are unchanged.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preferences updated successfully")
    })
    public NotificationPreferenceResponse updatePreferences(
            @Valid @RequestBody final UpdatePreferenceRequest request) {
        return notificationService.updatePreferences(userContext.requireProfileId(), request);
    }

    /**
     * Manually triggers a notification to any user (admin only).
     *
     * @param request the send request
     * @return the created notification
     */
    @PostMapping("/send")
    @PreAuthorize("hasRole('" + AppConstants.ROLE_ADMIN + "')")
    @Operation(summary = "Send manual notification",
            description = "Admin-only: manually dispatches a notification to any user over the requested channel.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Notification created and dispatched"),
            @ApiResponse(responseCode = "400", description = "Recipient preferences suppress the channel/category"),
            @ApiResponse(responseCode = "403", description = "Requires the ADMIN role")
    })
    public ResponseEntity<NotificationResponse> sendNotification(
            @Valid @RequestBody final SendNotificationRequest request) {
        final NotificationResponse response = notificationService.sendManual(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists the admin-managed email templates.
     *
     * @return the list of templates
     */
    @GetMapping("/templates")
    @Operation(summary = "List email templates",
            description = "Returns all admin-managed email templates.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Templates retrieved successfully")
    })
    public List<EmailTemplateResponse> listTemplates() {
        return notificationService.listTemplates();
    }

    /**
     * Creates an admin-managed email template (admin only).
     *
     * @param request the create request
     * @return the created template
     */
    @PostMapping("/templates")
    @PreAuthorize("hasRole('" + AppConstants.ROLE_ADMIN + "')")
    @Operation(summary = "Create email template",
            description = "Admin-only: creates an email template that overrides the built-in classpath template for a key.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Template created successfully"),
            @ApiResponse(responseCode = "400", description = "Template key already exists"),
            @ApiResponse(responseCode = "403", description = "Requires the ADMIN role")
    })
    public ResponseEntity<EmailTemplateResponse> createTemplate(
            @Valid @RequestBody final CreateTemplateRequest request) {
        final EmailTemplateResponse response = notificationService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns today's notification statistics (admin only).
     *
     * @return the stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('" + AppConstants.ROLE_ADMIN + "')")
    @Operation(summary = "Get notification stats",
            description = "Admin-only: returns today's dispatch statistics by type and channel.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stats retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Requires the ADMIN role")
    })
    public NotificationStatsResponse getStats() {
        return notificationService.getStats();
    }
}
