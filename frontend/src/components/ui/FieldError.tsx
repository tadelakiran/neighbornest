import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldErrorProps {
  message?: string;
  className?: string;
}

/**
 * Inline validation error with a shake animation. The message is used as the
 * element key so a new message re-triggers the shake.
 */
export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;

  return (
    <motion.p
      key={message}
      role="alert"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={cn('mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-400', className)}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </motion.p>
  );
}
