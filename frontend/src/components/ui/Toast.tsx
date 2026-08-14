import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/stores/toastStore';
import { TOAST_DURATION_MS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Toast as ToastEntry, ToastType } from '@/types/auth.types';

const TOAST_STYLES: Record<
  ToastType,
  {
    icon: typeof Info;
    iconClass: string;
    barClass: string;
    borderClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-[var(--success)]',
    barClass: 'bg-[var(--success)]',
    borderClass: 'border-[var(--success)]/20',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-[var(--error)]',
    barClass: 'bg-[var(--error)]',
    borderClass: 'border-[var(--error)]/20',
  },
  info: {
    icon: Info,
    iconClass: 'text-[var(--accent-400)]',
    barClass: 'bg-[var(--accent-400)]',
    borderClass: 'border-[var(--accent-400)]/20',
  },
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastEntry;
  onDismiss: (id: string) => void;
}) {
  const { icon: Icon, iconClass, barClass, borderClass } = TOAST_STYLES[toast.type];
  const elapsed = Date.now() - toast.createdAt;
  const remaining = Math.max(0, TOAST_DURATION_MS - elapsed);

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-[var(--radius-lg)]',
        'border bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)]',
        borderClass
      )}
    >
      <span
        className={cn('absolute inset-y-0 left-0 w-1 rounded-l-[var(--radius-lg)]', barClass)}
        aria-hidden="true"
      />
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconClass)} aria-hidden="true" />
      <p className="flex-1 text-sm leading-snug text-[var(--text-primary)]">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <span
        className={cn('toast-progress absolute bottom-0 left-0 h-0.5', barClass)}
        style={{ animationDuration: `${remaining}ms` }}
        aria-hidden="true"
      />
    </motion.div>
  );
}