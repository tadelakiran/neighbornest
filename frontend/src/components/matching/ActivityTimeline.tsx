import { motion } from 'framer-motion';
import { Activity, CalendarDays, Handshake, Home, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineCategory = 'nest' | 'proposal' | 'meeting' | 'system';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  /** Human-friendly timestamp, e.g. "2 days ago". */
  time: string;
  category: TimelineCategory;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const CATEGORY_ICONS: Record<TimelineCategory, LucideIcon> = {
  nest:     Home,
  proposal: Handshake,
  meeting:  CalendarDays,
  system:   Sparkles,
};

/**
 * Vertical activity timeline with a glowing blue spine and pulsing dots.
 * Rows stagger in from the left; each row lifts slightly on hover.
 */
export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Glowing spine */}
      <div
        className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-accent-400/70 via-accent-500/30 to-transparent"
        aria-hidden="true"
      />

      <ol className="space-y-5">
        {events.map((event, index) => {
          const Icon = CATEGORY_ICONS[event.category] ?? Sparkles;
          return (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex gap-4"
            >
              {/* Dot + icon */}
              <div className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-400/30 bg-deep shadow-[0_0_12px_rgba(14,165,233,0.25)] transition-transform duration-200 group-hover:scale-110">
                <span className="glow-dot absolute inset-0 rounded-full opacity-40" aria-hidden="true" />
                <Icon className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="flex-1 rounded-xl border border-white/[0.06] bg-surface/60 p-3.5 transition-all duration-200 group-hover:border-accent-400/25 group-hover:bg-surface">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-primary">{event.title}</h4>
                  <span className="shrink-0 text-[11px] font-medium text-muted">{event.time}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-secondary">{event.description}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {events.length === 0 && (
        <div className="flex items-center gap-2 py-2 text-sm text-muted">
          <Activity className="h-4 w-4" aria-hidden="true" />
          No activity yet — your journey starts with your first match.
        </div>
      )}
    </div>
  );
}
