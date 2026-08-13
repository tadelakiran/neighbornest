import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface StackMember {
  userId: number;
  fullName?: string;
  profilePhotoUrl?: string;
}

interface MemberAvatarStackProps {
  members: StackMember[];
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
} as const;

export function MemberAvatarStack({ members, max = 4, size = 'md', className }: MemberAvatarStackProps) {
  const visible = members.slice(0, max);
  const extra = members.length - visible.length;

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2.5">
        {visible.map((member, i) => (
          <div
            key={member.userId}
            className="relative transition-all duration-200 hover:z-10 hover:-translate-y-1"
            style={{ zIndex: visible.length - i }}
          >
            <Avatar
              name={member.fullName || 'Neighbor'}
              src={member.profilePhotoUrl}
              size={size === 'sm' ? 'sm' : 'md'}
              className="ring-[2.5px] ring-deep shadow-lg transition-shadow duration-200 hover:shadow-xl"
            />
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span
          className={cn(
            'z-10 -ml-1 flex items-center justify-center rounded-full',
            'bg-surface-2 font-bold text-accent-300',
            'border border-accent-400/20 shadow-md shadow-accent-400/10',
            SIZE_CLASSES[size]
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}