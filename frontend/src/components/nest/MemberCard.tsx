import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { NestMemberResponse } from '@/types/nest.types';

interface MemberCardProps {
  member: NestMemberResponse;
  /** Stagger index for the entrance animation. */
  index?: number;
  /** Fired when the user clicks the message shortcut on this member. */
  onMessage?: (member: NestMemberResponse) => void;
}

/**
 * Deterministic pseudo-random "online" flag so status stays stable across
 * renders while still looking organic (~60% online).
 *
 * @param userId - the member's profile id
 * @returns true when the member should appear online
 */
function isOnline(userId: number): boolean {
  return (((userId * 2654435761) >>> 0) % 10) < 6;
}

/**
 * A single Nest member: avatar with a role ring (gold + crown for the anchor),
 * name, and a live online-status dot. Lifts and brightens on hover.
 */
export function MemberCard({ member, index = 0, onMessage }: MemberCardProps) {
  const isAnchor = member.roleInNest === 'ANCHOR';
  const online = useMemo(() => isOnline(member.userId), [member.userId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group flex w-24 shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-deep)]/60 p-4 backdrop-blur-xl transition-colors duration-300 hover:border-[var(--accent-400)]/30 hover:bg-[var(--color-deep)]"
    >
      <div className="relative">
        {/* Role ring */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-0 rounded-full transition-transform duration-300 group-hover:scale-105',
            isAnchor
              ? 'ring-2 ring-amber-400/80 shadow-[0_0_18px_rgba(251,191,36,0.35)]'
              : 'ring-1 ring-white/10'
          )}
        />
        <Avatar name={member.fullName} src={member.profilePhotoUrl} size="xl" className="rounded-full ring-0" />

        {/* Anchor crown badge */}
        {isAnchor && (
          <span
            title="Nest Anchor"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400 text-void shadow-glow-sm"
          >
            <Crown className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}

        {/* Online status dot */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute -bottom-0.5 left-0.5 h-3 w-3 rounded-full border-2 border-deep transition-colors',
            online ? 'bg-accent-400 shadow-[0_0_8px_rgba(14,165,233,0.9)]' : 'bg-slate-600'
          )}
        />
      </div>

      <p className="w-full truncate text-center text-sm font-medium text-primary transition-colors duration-200 group-hover:text-accent-300">
        {member.fullName}
      </p>
      {isAnchor && (
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
          Anchor
        </span>
      )}

      {onMessage && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMessage(member);
          }}
          title={`Message ${member.fullName}`}
          aria-label={`Message ${member.fullName}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-muted)] transition-all duration-200 hover:border-[var(--accent-400)]/40 hover:bg-[var(--accent-400)]/10 hover:text-[var(--accent-300)]"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}
