import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

interface DarkModeToggleProps {
  /** 'icon' = compact icon button, 'pill' = labeled pill toggle */
  variant?: 'icon' | 'pill';
  className?: string;
}

/**
 * Animated dark-mode toggle. Persisted to localStorage via themeStore.
 * Uses Framer Motion for icon cross-fade and a spring knob on the pill variant.
 */
export function DarkModeToggle({ variant = 'icon', className }: DarkModeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        className={cn(
          'relative inline-flex h-8 w-16 items-center rounded-full border transition-colors duration-300',
          'border-[var(--color-border)]',
          isDark ? 'bg-[var(--color-deep)]' : 'bg-[var(--color-surface-2)]',
          className
        )}
      >
        {/* Knob */}
        <motion.span
          className={cn(
            'absolute flex h-6 w-6 items-center justify-center rounded-full shadow-[var(--shadow-sm)]',
            isDark
              ? 'bg-[var(--accent-400)] shadow-[0_0_12px_rgba(14,165,233,0.35)]'
              : 'bg-white border border-[var(--color-border)]'
          )}
          animate={{ x: isDark ? 34 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.span
                key="moon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Moon className="h-3.5 w-3.5 text-white" />
              </motion.span>
            ) : (
              <motion.span
                key="sun"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Sun className="h-3.5 w-3.5 text-[var(--accent-500)]" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
        <span className="sr-only">{isDark ? 'Dark mode on' : 'Light mode on'}</span>
      </button>
    );
  }

  // Default: icon button
  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
        'border border-[var(--color-border)] bg-[var(--color-surface)]',
        'hover:border-[var(--accent-400)]/40 hover:bg-[var(--color-raised)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-400)]/40',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 30, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-4 w-4 text-[var(--accent-400)]" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ scale: 0.5, rotate: 30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: -30, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-4 w-4 text-[var(--accent-500)]" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}