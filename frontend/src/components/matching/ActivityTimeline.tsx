import { motion } from 'framer-motion';
import { Activity, CalendarDays, Handshake, Home, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineCategory = 'nest' | 'proposal' | 'meeting' | 'system';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  category: TimelineCategory;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const CATEGORY_META: Record<TimelineCategory, { icon: LucideIcon; accent: string; glow: string }> = {
  nest:     { icon: Home,        accent: 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/25', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.25)]' },
  proposal: { icon: Handshake,   accent: 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/25',       glow: 'shadow-[0_0_12px_rgba(251,191,36,0.25)]' },
  meeting:  { icon: CalendarDays, accent: 'text-violet-400 bg-violet-400/10 border-violet-400/25',  glow: 'shadow-[0_0_12px_rgba(167,139,250,0.25)]' },
  system:   { icon: Sparkles,    accent: 'text-accent-400 bg-accent-400/10 border-accent-400/25',   glow: 'shadow-[0_0_12px_rgba(14,165,233,0.3)]' },
};

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Glowing spine */}
      <div
        className="absolute bottom-3 left-[19px] top-3 w-px bg-gradient-to-b from-accent-400/60 via-accent-500/25 to-transparent"
        aria-hidden="true"
      />
      {/* Spine glow line */}
      <div
        className="absolute bottom-3 left-[19px] top-3 w-px bg-accent-400/20 blur-sm"
        aria-hidden="true"
      />

      <ol className="space-y-4">
        {events.map((event, index) => {
          const meta = CATEGORY_META[event.category] ?? CATEGORY_META.system;
          const Icon = meta.icon;
          return (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex gap-4"
            >
              {/* Connector dot */}
              <div className="relative z-10 mt-1 flex h-[38px] w-[38px] shrink-0 items-center justify-center">
                <span className={cn(
                  'absolute inset-0 rounded-full border transition-all duration-300',
                  meta.accent,
                  meta.glow
                )} />
                <span className="absolute inset-0 rounded-full bg-deep" />
                <Icon className={cn(
                  'relative h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110',
                  meta.accent.split(' ')[0]
                )} aria-hidden="true" />
              </div>

              {/* Content card */}
              <div className={cn(
                'flex-1 rounded-xl border p-3.5 transition-all duration-200',
                'border-[var(--color-border)] bg-[var(--color-surface)]/50',
                'group-hover:border-accent-400/20 group-hover:bg-surface group-hover:shadow-md'
              )}>
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-primary">{event.title}</h4>
                  <span className="shrink-0 rounded-full bg-[var(--color-raised)]/40 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                    {event.time}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-secondary">{event.description}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {events.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-8 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-400/10 ring-1 ring-accent-400/20">
            <Activity className="h-6 w-6 text-accent-300" aria-hidden="true" />
          </span>
          <p className="text-sm text-muted">No activity yet</p>
          <p className="max-w-[14rem] text-xs text-subtle">Your journey starts with your first match.</p>
        </motion.div>
      )}
    </div>
  );
}