import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { MemberCard } from '@/components/nest/MemberCard';
import type { NestMemberResponse } from '@/types/nest.types';

interface MemberGalleryProps {
  members: NestMemberResponse[];
}

/**
 * Horizontal-scrolling gallery of Nest member cards with a dashed
 * "Invite Member" placeholder (disabled — coming soon).
 */
export function MemberGallery({ members }: MemberGalleryProps) {
  return (
    <section aria-label="Nest members" className="overflow-hidden">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted">
        <Users className="h-4 w-4 text-accent-400" aria-hidden="true" />
        Members · {members.length}
      </h2>

      <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
        <motion.div
          initial="hidden"
          animate="show"
          className="flex gap-3"
        >
          {members.map((member, i) => (
            <MemberCard key={member.userId} member={member} index={i} />
          ))}

          {/* Invite placeholder */}
          <div className="group relative flex w-24 shrink-0 cursor-not-allowed flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 p-4 opacity-60 transition-opacity hover:opacity-80">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
              <Plus className="h-6 w-6 text-muted" aria-hidden="true" />
            </span>
            <p className="text-xs font-medium text-muted">Invite</p>
            <span
              role="tooltip"
              className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-lg border border-white/10 bg-raised px-3 py-1.5 text-xs text-secondary opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
            >
              Coming soon
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
