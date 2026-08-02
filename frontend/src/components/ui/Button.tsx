import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

/** Visual variants for the button. */
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/** Size presets for the button. */
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables interaction while true. */
  isLoading?: boolean;
  /** Stretches the button to fill its container. */
  fullWidth?: boolean;
  /** Optional icon rendered before the label. */
  leftIcon?: ReactNode;
  /** Optional icon rendered after the label. */
  rightIcon?: ReactNode;
}

/** Base classes shared by every variant. */
const BASE_CLASSES =
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60';

/** Variant-specific classes. */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:bg-emerald-600',
  secondary:
    'border border-slate-700 bg-slate-800 text-slate-100 hover:border-slate-600 hover:bg-slate-700/70 active:bg-slate-700',
  danger: 'border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 active:bg-rose-500/25',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100',
};

/** Size-specific classes. */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
};

/**
 * Primary button component with variants, sizes, icons, and a loading state.
 *
 * @example
 * <Button variant="primary" size="lg" isLoading={submitting} leftIcon={<Mail />}>
 *   Sign in
 * </Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? <Spinner size="sm" className="text-current opacity-80" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
