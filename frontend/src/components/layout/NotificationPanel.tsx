import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BadgeCheck,
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

const POLL_MS = 30_000;

const TYPE_META: Record<NotificationType, { icon: LucideIcon; accent: string }> = {
  NEST_CREATED:     { icon: Home, accent: 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20' },
  NEST_GRADUATED:   { icon: GraduationCap, accent: 'text-sky-300 bg-sky-300/10 border-sky-300/20' },
  NEST_DISBANDED:   { icon: XCircle, accent: 'text-[var(--error)] bg-[var(--error)]/10 border-[var(--error)]/20' },
  MEETING_REMINDER: { icon: CalendarClock, accent: 'text-accent-400 bg-accent-400/10 border-accent-400/20' },
  EXPENSE_SPLIT:    { icon: Wallet, accent: 'text-royal-400 bg-royal-400/10 border-royal-400/20' },
  VIBE_CHECK_DUE:   { icon: HeartPulse, accent: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
  CHAT_MESSAGE:     { icon: MessageSquare, accent: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
  ANCHOR_APPLICATION:{ icon: BadgeCheck, accent: 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20' },
  SYSTEM:           { icon: BellRing, accent: 'text-[var(--text-muted)] bg-[var(--color-raised)]/40 border-[var(--color-border)]' },
};

const panelVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } },
};

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

  useEffect(() => {
    if (!isAuthed) return;
    refreshCount();
    const id = window.setInterval(refreshCount, POLL_MS);
    return () => window.clearInterval(id);
  }, [isAuthed, refreshCount]);

  useEffect(() => {
    if (!open || !isAuthed) return;
    let cancelled = false;
    setItems(null);
    getMyNotifications(0, 20)
      .then((page) => !cancelled && setItems(page.content))
      .catch(() => !cancelled && setItems([]));
    refreshCount();
    return () => { cancelled = true; };
  }, [open, isAuthed, refreshCount]);

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

  const handleOpen = () => setOpen((prev) => !prev);

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
    } else if (notification.type === 'ANCHOR_APPLICATION') {
      navigate('/profile');
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
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        aria-label={`Notifications${unreadVisible ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        <AnimatePresence>
          {unreadVisible && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-400 px-1 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(14,165,233,0.8)]"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-2xl backdrop-blur-2xl"
          >
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
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkAll}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-accent-300 transition-colors hover:bg-accent-400/10"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Mark all read
                </motion.button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[24rem] overflow-y-auto no-scrollbar">
              {items === null ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-400/10 ring-1 ring-accent-400/20">
                    <Bell className="h-6 w-6 text-accent-300" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-medium text-primary">You're all caught up</p>
                  <p className="max-w-[12rem] text-xs text-muted">
                    New Nest activity will show up here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: NotificationResponse;
  onClick: () => void;
}) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.SYSTEM;
  const Icon = meta.icon;
  const unread = notification.status !== 'READ';

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'group flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-200',
          unread ? 'bg-accent-400/[0.04]' : 'hover:bg-raised'
        )}
      >
        {/* Left accent */}
        <div className={cn(
          'mt-1 h-8 w-1 shrink-0 rounded-full transition-all duration-300',
          unread ? 'bg-accent-400/60' : 'bg-transparent group-hover:bg-white/5'
        )} />

        <span className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
          meta.accent
        )}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-bold text-primary">{notification.title}</span>
            <span className="shrink-0 text-[10px] text-muted">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-secondary">
            {notification.message}
          </span>
        </span>

        {unread && (
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(14,165,233,0.9)]" />
        )}
      </button>
    </li>
  );
}

// Helper since the user's code didn't show the import
function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}