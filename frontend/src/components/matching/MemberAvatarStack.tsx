import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface StackMember {
  userId: number;
  fullName?: string;
  profilePhotoUrl?: string;
}

interface MemberAvatarStackProps {
  members: StackMember[];
  /** Max avatars shown before the "+N" pill. Default 4. */
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
} as const;

/**
 * Horizontal row of overlapping member avatars (negative margin overlap).
 * When there are more members than `max`, the remainder collapses into a
 * "+N" pill so the row never grows unbounded.
 */
export function MemberAvatarStack({ members, max = 4, size = 'md', className }: MemberAvatarStackProps) {
  const visible = members.slice(0, max);
  const extra = members.length - visible.length;

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-3">
        {visible.map((member) => (
          <Avatar
            key={member.userId}
            name={member.fullName || 'Neighbor'}
            src={member.profilePhotoUrl}
            size={size === 'sm' ? 'sm' : 'md'}
            className="ring-2 ring-[var(--color-deep)] transition-transform duration-200 hover:-translate-y-1"
          />
        ))}
      </div>
      {extra > 0 && (
        <span
          className={cn(
            'z-10 ml-1 flex items-center justify-center rounded-full bg-raised font-semibold text-accent-300',
            'border border-white/10 shadow-md',
            SIZE_CLASSES[size]
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
