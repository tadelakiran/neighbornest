import { LogOut } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface LeaveNestModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Dedicated "Leave Nest" confirmation — wraps the shared ConfirmationModal
 * with the exact copy and danger styling the product spec calls for.
 */
export function LeaveNestModal({ open, onClose, onConfirm, isLoading = false }: LeaveNestModalProps) {
  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      title="Leave this Nest?"
      description="Are you sure? This cannot be undone. You'll lose access to this Nest's meetings, expenses and conversations."
      confirmLabel="Leave Nest"
      icon={LogOut}
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
}
