import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Main page title (Space Grotesk). */
  title: ReactNode;
  /** Optional supporting line under the title. */
  description?: ReactNode;
  /** Optional right-aligned actions / meta (badges, buttons, counts). */
  actions?: ReactNode;
  /** Optional eyebrow label rendered above the title. */
  eyebrow?: ReactNode;
  className?: string;
}

/**
 * Shared page header — one consistent heading pattern for every routed page:
 * Space Grotesk title, muted description, and a right rail for actions/badges.
 * Wraps gracefully: actions drop below the heading on small screens.
 */
export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-400)]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </motion.div>
  );
}
