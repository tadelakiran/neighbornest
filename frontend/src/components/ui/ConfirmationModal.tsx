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
  /** Accent color of the icon badge. */
  accent?: 'danger' | 'warning' | 'info';
}

const ACCENTS = {
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  info: 'border-accent-400/30 bg-accent-400/10 text-accent-300',
} as const;

/**
 * Reusable confirmation dialog for destructive/important actions. Renders the
 * standard modal with an icon, description, and Cancel / Confirm buttons.
 */
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
      <div className="flex flex-col items-center gap-4 text-center">
        <span className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border', ACCENTS[accent])}>
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-primary">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary">{description}</p>
        </div>
        <div className="mt-2 flex w-full gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            fullWidth
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
