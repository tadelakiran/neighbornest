import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';
import { TOAST_DURATION_MS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Toast as ToastEntry, ToastType } from '@/types/auth.types';

/** Icon + accent color per toast type. */
const TOAST_STYLES: Record<ToastType, { icon: typeof Info; iconClass: string; barClass: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-emerald-400', barClass: 'bg-emerald-400' },
  error: { icon: AlertCircle, iconClass: 'text-rose-400', barClass: 'bg-rose-400' },
  info: { icon: Info, iconClass: 'text-sky-400', barClass: 'bg-sky-400' },
};

/**
 * Global toast container — mounted once in App.tsx.
 * Renders the toast stack fixed to the top-right with a slide-in animation;
 * each toast auto-dismisses via the toast store.
 */
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastEntry;
  onDismiss: (id: string) => void;
}

/** Single toast notification card. */
function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { icon: Icon, iconClass, barClass } = TOAST_STYLES[toast.type];
  // Age the progress bar from the moment the toast was created so a refresh
  // never restarts the dismissal timer visually.
  const elapsed = Date.now() - toast.createdAt;
  const remaining = Math.max(0, TOAST_DURATION_MS - elapsed);

  return (
    <div
      role="status"
      className={cn(
        'animate-toast-in pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-lg',
        'border border-slate-700 bg-slate-800/95 p-4 shadow-xl shadow-black/30 backdrop-blur'
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', barClass)} aria-hidden="true" />
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconClass)} aria-hidden="true" />
      <p className="flex-1 text-sm leading-snug text-slate-200">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 text-slate-500 transition-colors hover:text-slate-200"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
      {/* Auto-dismiss progress bar */}
      <span
        className={cn('toast-progress absolute bottom-0 left-0 h-0.5', barClass)}
        style={{ animationDuration: `${remaining}ms` }}
        aria-hidden="true"
      />
    </div>
  );
}
