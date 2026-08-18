import { useCallback, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  nonMagnetic?: boolean;
}

const BASE =
  'relative inline-flex select-none items-center justify-center gap-2 font-semibold ' +
  'rounded-xl transition-all duration-200 will-change-transform ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-void ' +
  'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-gradient text-white shadow-glow-sm ' +
    'hover:shadow-glow hover:brightness-110',
  secondary:
    'bg-surface-2 text-primary ' +
    'border border-[var(--color-border)] ' +
    'hover:border-[var(--accent-400)]/40 hover:bg-[var(--color-surface)] hover:text-[var(--accent-600)]',
  outline:
    'bg-transparent border border-[var(--accent-400)]/40 text-[var(--accent-600)] ' +
    'hover:bg-[var(--accent-400)]/10 hover:border-[var(--accent-500)]/60 hover:text-[var(--accent-600)]',
  ghost:
    'bg-transparent text-[var(--accent-600)] ' +
    'hover:bg-[var(--accent-400)]/10 hover:text-[var(--accent-600)]',
  danger:
    'border border-[var(--error)]/25 bg-[var(--error)]/10 text-[var(--error)] ' +
    'hover:bg-[var(--error)]/15 hover:border-[var(--error)]/35 hover:text-[var(--error)]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  nonMagnetic = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  onMouseMove,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const pressedRef = useRef(false);

  const applyMagnetic = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const el = ref.current;
      if (!el || nonMagnetic || isLoading || disabled) return;
      const canMagnet = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
      if (!canMagnet) return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const max = size === 'lg' ? 5 : size === 'sm' ? 2.5 : 4;
      const pullX = Math.max(-max, Math.min(max, dx * 0.12));
      const pullY = Math.max(-max, Math.min(max, dy * 0.12));
      el.style.transform = `translate(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px)`;
    },
    [nonMagnetic, isLoading, disabled, size]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseMove?.(e);
      applyMagnetic(e);
    },
    [onMouseMove, applyMagnetic]
  );
  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseLeave?.(e);
      pressedRef.current = false;
      if (ref.current) ref.current.style.transform = '';
    },
    [onMouseLeave]
  );
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      pressedRef.current = true;
      applyMagnetic(e);
    },
    [applyMagnetic]
  );
  const handleMouseUp = useCallback(() => {
    pressedRef.current = false;
  }, []);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {isLoading ? <Spinner size="sm" className="text-current opacity-80" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

export const MotionButton = motion(Button);