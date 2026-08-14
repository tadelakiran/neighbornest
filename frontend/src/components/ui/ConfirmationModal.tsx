import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  icon?: LucideIcon;
  accent?: 'danger' | 'warning' | 'info';
}

const ACCENTS = {
  danger: 'border-[var(--error)]/30 bg-[var(--error)]/10 text-[var(--error)] shadow-[var(--error-glow)]',
  warning: 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)] shadow-[var(--warning-glow)]',
  info: 'border-[var(--accent-400)]/30 bg-[var(--accent-400)]/10 text-[var(--accent-300)] shadow-[var(--shadow-glow-sm)]',
} as const;

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
  icon: Icon = AlertTriangle,
  accent = 'danger',
}: ConfirmationModalProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <span className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border', ACCENTS[accent])}>
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-primary">{title}</h3>
          <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-secondary">{description}</p>
        </div>
        <div className="flex w-full gap-3">
          <Button variant="ghost" fullWidth onClick={onClose} disabled={isLoading} className="rounded-xl">
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            fullWidth
            isLoading={isLoading}
            onClick={onConfirm}
            className="rounded-xl"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}