import { cn, getInitials } from '@/lib/utils';

/** Available avatar sizes. */
type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  /** Person's name — used for initials fallback and alt text. */
  name: string;
  /** Optional profile photo URL. */
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

/** Pixel classes for each avatar size. */
const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

/**
 * Circular avatar that renders a profile photo, or a gradient monogram with the
 * user's initials when no photo is available.
 */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', SIZE_CLASSES[size], className)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        'bg-gradient-to-br from-emerald-500 to-teal-600 text-emerald-50',
        SIZE_CLASSES[size],
        className
      )}
    >
      {initials}
    </span>
  );
}
