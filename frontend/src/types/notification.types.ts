/**
 * TypeScript contracts for the notification-service API.
 *
 * The notification-service serializes responses in snake_case (verified
 * against the DTOs in `backend/notification-service`).
 */

/** Category of a notification (drives the inbox icon + preference gating). */
export type NotificationType =
  | 'NEST_CREATED'
  | 'NEST_GRADUATED'
  | 'NEST_DISBANDED'
  | 'MEETING_REMINDER'
  | 'EXPENSE_SPLIT'
  | 'VIBE_CHECK_DUE'
  | 'CHAT_MESSAGE'
  | 'ANCHOR_APPLICATION'
  | 'SYSTEM';

/** Delivery channel of a notification. */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';

/** Dispatch lifecycle status. */
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

/** A single notification in the user's inbox. */
export interface NotificationResponse {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  relatedEntityType?: string;
  relatedEntityId?: number;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

/** Total / unread / read counts from `GET /api/notifications/me/unread-count`. */
export interface NotificationCountResponse {
  total: number;
  unread: number;
  read: number;
}

/** Paginated inbox (Spring Page serialization). */
export interface NotificationsPage {
  content: NotificationResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
