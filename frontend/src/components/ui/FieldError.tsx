import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldErrorProps {
  message?: string;
  className?: string;
}

/**
 * Inline validation error with a CSS shake.
 * The message is used as the element key so a new message re-triggers the shake.
 * Pure CSS (no framer-motion) to keep bundles lean.
 */
export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      key={message}
      role="alert"
      className={cn(
        'error-shake mt-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--error)]',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}