import { api, cachedGet, invalidateCache } from '@/services/api';
import type {
  NotificationCountResponse,
  NotificationResponse,
  NotificationsPage,
} from '@/types/notification.types';

/**
 * Notification-service API — thin wrappers around the shared axios instance.
 * All endpoints hit the API Gateway and require a valid JWT (attached by the
 * request interceptor).
 */

const INBOX_KEY = '/api/notifications/me';
const COUNT_KEY = '/api/notifications/me/unread-count';

/**
 * Returns the caller's notification inbox, newest first (cached 15s).
 *
 * @param page - zero-based page index
 * @param size - page size (the service clamps it)
 */
export function getMyNotifications(page = 0, size = 20): Promise<NotificationsPage> {
  return cachedGet<NotificationsPage>(`${INBOX_KEY}?page=${page}&size=${size}`, 15_000);
}

/** Returns the caller's total / unread / read counts (cached 15s). */
export function getUnreadCount(): Promise<NotificationCountResponse> {
  return cachedGet<NotificationCountResponse>(COUNT_KEY, 15_000);
}

/** Marks a single notification as read and returns it. */
export async function markNotificationRead(notificationId: number): Promise<NotificationResponse> {
  const { data } = await api.put<NotificationResponse>(`/api/notifications/${notificationId}/read`);
  invalidateCache(INBOX_KEY);
  invalidateCache(COUNT_KEY);
  return data;
}

/** Marks every notification as read and returns the updated counts. */
export async function markAllNotificationsRead(): Promise<NotificationCountResponse> {
  const { data } = await api.put<NotificationCountResponse>('/api/notifications/me/read-all');
  invalidateCache(INBOX_KEY);
  invalidateCache(COUNT_KEY);
  return data;
}

/** Drops the cached inbox + count (call after any mutating action). */
export function invalidateNotifications(): void {
  invalidateCache(INBOX_KEY);
  invalidateCache(COUNT_KEY);
}
