import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  GraduationCap,
  HeartPulse,
  Home,
  MessageSquare,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils';
import {
  getMyNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';
import type { NotificationResponse, NotificationType } from '@/types/notification.types';

/** Polling interval for the unread badge. */
const POLL_MS = 30_000;

/** Icon + accent per notification category. */
const TYPE_META: Record<NotificationType, { icon: LucideIcon }> = {
  NEST_CREATED: { icon: Home },
  NEST_GRADUATED: { icon: GraduationCap },
  NEST_DISBANDED: { icon: XCircle },
  MEETING_REMINDER: { icon: CalendarClock },
  EXPENSE_SPLIT: { icon: Wallet },
  VIBE_CHECK_DUE: { icon: HeartPulse },
  CHAT_MESSAGE: { icon: MessageSquare },
  SYSTEM: { icon: BellRing },
};

/**
 * Notification bell + dropdown inbox. Shows a live unread badge (polled),
 * a scrollable list with per-type icons, mark-read on click, and a
 * "mark all read" action. Nest-related notifications deep-link to the Nest.
 */
export function NotificationPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthed = Boolean(user);

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationResponse[] | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(() => {
    if (!isAuthed) return;
    getUnreadCount()
      .then((c) => setUnread(c.unread))
      .catch(() => undefined);
  }, [isAuthed]);

  // Poll the unread badge while the app is open.
  useEffect(() => {
    if (!isAuthed) return;
    refreshCount();
    const id = window.setInterval(refreshCount, POLL_MS);
    return () => window.clearInterval(id);
  }, [isAuthed, refreshCount]);

  // Load the inbox when the panel opens.
  useEffect(() => {
    if (!open || !isAuthed) return;
    let cancelled = false;
    setItems(null);
    getMyNotifications(0, 20)
      .then((page) => !cancelled && setItems(page.content))
      .catch(() => !cancelled && setItems([]));
    refreshCount();
    return () => {
      cancelled = true;
    };
  }, [open, isAuthed, refreshCount]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleItemClick = (notification: NotificationResponse) => {
    setOpen(false);
    if (notification.status !== 'READ') {
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) =>
        (prev ?? []).map((n) => (n.id === notification.id ? { ...n, status: 'READ' } : n))
      );
      void markNotificationRead(notification.id).catch(() => undefined);
    }
    if (notification.relatedEntityType === 'NEST' && notification.relatedEntityId) {
      navigate(`/nests/${notification.relatedEntityId}`);
    } else if (notification.type === 'CHAT_MESSAGE') {
      navigate('/messages');
    }
  };

  const handleMarkAll = () => {
    setUnread(0);
    setItems((prev) => (prev ?? []).map((n) => ({ ...n, status: 'READ' })));
    void markAllNotificationsRead().catch(() => undefined);
  };

  const unreadVisible = isAuthed && unread > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-secondary transition-colors hover:text-primary"
        aria-label={`Notifications${unreadVisible ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadVisible && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-400 px-1 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(14,165,233,0.8)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-surface/95 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
              <BellRing className="h-4 w-4 text-accent-400" aria-hidden="true" />
              Notifications
              {unreadVisible && (
                <span className="rounded-full bg-accent-400/15 px-2 py-0.5 text-[10px] font-bold text-accent-300">
                  {unread} new
                </span>
              )}
            </h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-accent-300 transition-colors hover:bg-accent-400/10"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[24rem] overflow-y-auto">
            {items === null ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-400/10">
                  <Bell className="h-6 w-6 text-accent-300" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-primary">You're all caught up</p>
                <p className="text-xs text-muted">New Nest activity will show up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleItemClick(notification)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** A single notification row: icon, title/message, time, unread dot. */
function NotificationRow({
  notification,
  onClick,
}: {
  notification: NotificationResponse;
  onClick: () => void;
}) {
  const Icon = TYPE_META[notification.type]?.icon ?? TYPE_META.SYSTEM.icon;
  const unread = notification.status !== 'READ';

  return (
    <li>
      <button
        onClick={onClick}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-raised)] ${
          unread ? 'bg-accent-400/[0.06]' : ''
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            unread ? 'bg-accent-400/15 text-accent-300' : 'bg-white/[0.04] text-muted'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-bold text-primary">{notification.title}</span>
            <span className="shrink-0 text-[10px] text-muted">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-secondary">{notification.message}</span>
        </span>
        {unread && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(14,165,233,0.9)]" />
        )}
      </button>
    </li>
  );
}
