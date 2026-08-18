package com.neighbornest.notificationservice.constants;

/**
 * Central constants for the Notification Service.
 * <p>
 * All fixed strings, sizes and schedules used across the notification domain
 * live here so no magic numbers or magic strings leak into business code.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public final class AppConstants {

    private AppConstants() {
        // Utility class — no instances.
    }

    /** Default page size for the notification inbox. */
    public static final int DEFAULT_PAGE_SIZE = 20;

    /** Default page size as a string (annotation values must be compile-time constants). */
    public static final String DEFAULT_PAGE_SIZE_STRING = "20";

    /** Upper bound for the page size parameter (guards against unbounded queries). */
    public static final int MAX_PAGE_SIZE = 100;

    /** Retention window for notifications before the cleanup job purges them. */
    public static final int MAX_NOTIFICATION_AGE_DAYS = 30;

    /** Brand name used in email copy. */
    public static final String APP_NAME = "NeighborNest";

    /** Support address used in email footers. */
    public static final String SUPPORT_EMAIL = "support@neighbornest.com";

    /** HTTP header carrying the service-to-service API key. */
    public static final String INTERNAL_API_KEY_HEADER = "X-Internal-Key";

    /** Classpath email template keys. */
    public static final String TEMPLATE_OTP_VERIFICATION = "otp-verification";
    public static final String TEMPLATE_PASSWORD_RESET = "password-reset";
    public static final String TEMPLATE_WELCOME = "welcome";
    public static final String TEMPLATE_NEST_WELCOME = "nest-welcome";
    public static final String TEMPLATE_NEST_GRADUATE = "nest-graduate";
    public static final String TEMPLATE_NEST_DISBANDED = "nest-disbanded";
    public static final String TEMPLATE_MEETING_REMINDER = "meeting-reminder";
    public static final String TEMPLATE_EXPENSE_ALERT = "expense-alert";
    public static final String TEMPLATE_VIBE_CHECK_REMINDER = "vibe-check-reminder";
    public static final String TEMPLATE_CHAT_OFFLINE = "chat-offline";

    /** Subject templates — placeholders use the {{var}} syntax that
     *  {@code TemplateService.replacePlaceholders} substitutes before sending. */
    public static final String SUBJECT_NEST_WELCOME = "Welcome to {{nestName}}!";
    public static final String SUBJECT_NEST_GRADUATE = "Congratulations! You graduated from {{nestName}}.";
    public static final String SUBJECT_NEST_DISBANDED = "Your Nest has been disbanded";
    public static final String SUBJECT_MEETING_REMINDER = "Meeting reminder: {{activityType}}";
    public static final String SUBJECT_EXPENSE_ALERT = "Settle up: {{description}}";
    public static final String SUBJECT_VIBE_CHECK_REMINDER = "Vibe check due for {{nestName}}";
    public static final String SUBJECT_CHAT_OFFLINE = "New message from {{senderName}}";
    public static final String SUBJECT_OTP_VERIFICATION = "Your " + APP_NAME + " verification code";
    public static final String SUBJECT_PASSWORD_RESET = "Reset your " + APP_NAME + " password";
    public static final String SUBJECT_WELCOME = "Welcome to " + APP_NAME + "!";

    /** Related-entity type values. */
    public static final String RELATED_ENTITY_NEST = "NEST";
    public static final String RELATED_ENTITY_MEETING = "MEETING";
    public static final String RELATED_ENTITY_EXPENSE = "EXPENSE";

    /** Platform role required for admin endpoints. */
    public static final String ROLE_ADMIN = "ADMIN";

    /** Nest status values consumed by the scheduler. */
    public static final String NEST_STATUS_ACTIVE = "ACTIVE";
    public static final String NEST_STATUS_VIBE_CHECK = "VIBE_CHECK";

    /** Nest membership status meaning the member is actively in the Nest. */
    public static final String NEST_MEMBER_STATUS_ACCEPTED = "ACCEPTED";

    /** Meeting status meaning the meeting is still scheduled. */
    public static final String MEETING_STATUS_SCHEDULED = "SCHEDULED";

    /** Threshold (days) after which an unsettled expense triggers a reminder. */
    public static final int EXPENSE_REMINDER_AGE_DAYS = 3;

    /** HTTP header that (when the gateway is configured to add it) carries the
     *  current user's profile id. Identity otherwise comes from the JWT. */
    public static final String X_USER_ID_HEADER = "X-User-Id";

    /** Standard Authorization header name. */
    public static final String AUTHORIZATION_HEADER = "Authorization";

    /** Bearer token prefix. */
    public static final String BEARER_PREFIX = "Bearer ";

    /** Fallback display name prefix when the user-service is unavailable. */
    public static final String UNKNOWN_USER_PREFIX = "User ";

    /** Fallback display name prefix for the welcome email member list. */
    public static final String UNKNOWN_MEMBER_PREFIX = "Member ";

    /** Email template variable names shared across listeners. */
    public static final String VAR_NEST_NAME = "nestName";
    public static final String VAR_USER_NAME = "userName";
    public static final String VAR_CITY = "city";
    public static final String VAR_MEMBERS = "members";
    public static final String VAR_NEST_LINK = "nestLink";
    public static final String VAR_CHAT_LINK = "chatLink";
    public static final String VAR_MEETING_DATE = "meetingDate";
    public static final String VAR_ACTIVITY_TYPE = "activityType";
    public static final String VAR_VENUE_NAME = "venueName";
    public static final String VAR_DESCRIPTION = "description";
    public static final String VAR_AMOUNT = "amount";
    public static final String VAR_SENDER_NAME = "senderName";
    public static final String VAR_MESSAGE_PREVIEW = "messagePreview";
    public static final String VAR_OTP_CODE = "otpCode";
    /** Alias for the OTP code — some EmailJS dashboard templates use {{passcode}}. */
    public static final String VAR_OTP_PASSCODE = "passcode";
    public static final String VAR_OTP_EXPIRY_MINUTES = "expiryMinutes";
    /** Alias for the expiry duration (e.g. "10 minutes") — dashboard templates use {{time}}. */
    public static final String VAR_OTP_EXPIRY_TIME = "time";
    public static final String VAR_APP_NAME = "appName";
    /** Alias for the brand name — generic dashboard templates use {{companyName}} / {{company_name}}. */
    public static final String VAR_COMPANY_NAME = "companyName";
    public static final String VAR_COMPANY_NAME_SNAKE = "company_name";
    public static final String VAR_SUPPORT_EMAIL = "supportEmail";
    /** Alias for the support address — dashboard templates may use {{support_email}}. */
    public static final String VAR_SUPPORT_EMAIL_SNAKE = "support_email";
    public static final String VAR_FULL_NAME = "fullName";
    public static final String VAR_DASHBOARD_LINK = "dashboardLink";

    /** Scheduled cleanup job cron (03:00 daily). */
    public static final String CLEANUP_CRON = "0 0 3 * * *";

    /** Scheduled morning reminder job cron (09:00 daily). */
    public static final String MORNING_REMINDER_CRON = "0 0 9 * * *";

    /** Scheduled evening reminder job cron (18:00 daily). */
    public static final String EVENING_REMINDER_CRON = "0 0 18 * * *";
}
