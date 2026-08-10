import { motion } from 'framer-motion';
import { MapPin, Sparkles, Trophy } from 'lucide-react';
import { daysRemaining, weekOf } from '@/lib/nest';
import { cn } from '@/lib/utils';
import type { NestResponse, NestStatus } from '@/types/nest.types';

/** Per-status badge styling: ACTIVE pings fast, VIBE_CHECK pulses slowly, GRADUATED glows. */
const BADGE_STYLES: Record<NestStatus, { chip: string; dot: string; ping: boolean; slow: boolean }> = {
  ACTIVE: { chip: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300', dot: 'bg-emerald-400', ping: true, slow: false },
  VIBE_CHECK: { chip: 'border-amber-500/30 bg-amber-500/20 text-amber-300', dot: 'bg-amber-400', ping: false, slow: true },
  GRADUATED: { chip: 'border-accent-500/30 bg-accent-500/20 text-accent-300 shadow-glow', dot: 'bg-accent-300', ping: false, slow: false },
  FORMING: { chip: 'border-white/10 bg-white/[0.05] text-secondary', dot: 'bg-slate-400', ping: false, slow: false },
  RE_MATCHING: { chip: 'border-fuchsia-500/30 bg-fuchsia-500/20 text-fuchsia-300', dot: 'bg-fuchsia-400', ping: false, slow: true },
  DISBANDED: { chip: 'border-rose-500/30 bg-rose-500/20 text-rose-300', dot: 'bg-rose-400', ping: false, slow: false },
};

/**
 * Hero header of the Nest Hub: name, animated status badge, city, a segmented
 * week-of-6 progress bar, and a large days-remaining countdown.
 */
export function NestHero({ nest }: { nest: NestResponse }) {
  const week = weekOf(nest.startDate);
  const days = daysRemaining(nest.endDate);
  const badge = BADGE_STYLES[nest.status] ?? BADGE_STYLES.FORMING;
  const graduated = nest.status === 'GRADUATED';

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-b-3xl border-b border-accent-500/10 bg-gradient-to-b from-deep via-deep to-accent-500/10 px-6 pb-8 pt-2 md:px-8"
    >
      {/* Ambient glow */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-10 h-56 w-56 rounded-full bg-accent-500/15 blur-3xl" />

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        {/* Identity */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl"
            >
              {nest.name}
            </motion.h1>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 320, damping: 20 }}
              className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider', badge.chip)}
            >
              <span className="relative flex h-2 w-2">
                {badge.ping && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" style={{ animationDuration: '1s' }} aria-hidden="true" />
                )}
                <span className={cn('relative inline-flex h-2 w-2 rounded-full', badge.dot, badge.slow && 'animate-pulse', badge.ping && 'bg-emerald-400')} style={badge.slow ? { animationDuration: '2s' } : undefined} aria-hidden="true" />
              </span>
              {nest.status.replace('_', ' ')}
            </motion.span>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-2 flex items-center gap-1.5 text-sm text-secondary"
          >
            <MapPin className="h-4 w-4 text-accent-400" aria-hidden="true" />
            {nest.city}
            <span className="text-white/10">•</span>
            {nest.members.length} member{nest.members.length === 1 ? '' : 's'}
          </motion.p>

          {/* Segmented week progress */}
          <div className="mt-5 max-w-md">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted">
                <Sparkles className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                Week {week} of 6
              </span>
              {!graduated && days !== null && (
                <span className="text-xs text-secondary">{days} day{days === 1 ? '' : 's'} to go</span>
              )}
            </div>
            <div className="flex gap-1.5" role="progressbar" aria-valuenow={week} aria-valuemin={1} aria-valuemax={6} aria-label="Nest week progress">
              {Array.from({ length: 6 }, (_, i) => {
                const filled = i < week;
                const current = i === week - 1;
                return (
                  <motion.span
                    key={i}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.25 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'left' }}
                    className={cn(
                      'h-2 flex-1 rounded-full transition-colors',
                      filled && 'bg-accent-gradient shadow-[0_0_8px_rgba(14,165,233,0.5)]',
                      current && 'animate-pulse',
                      !filled && 'bg-white/10'
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Days remaining countdown */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 rounded-2xl border border-white/[0.08] bg-deep/70 px-6 py-4 text-center backdrop-blur-xl"
        >
          {graduated ? (
            <>
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient shadow-glow">
                <Trophy className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <p className="mt-2 font-display text-lg font-bold text-accent-300">Graduated!</p>
              <p className="text-xs text-muted">Your Nest journey is complete</p>
            </>
          ) : (
            <>
              <p className="font-display text-5xl font-bold tabular-nums text-primary">
                {days ?? '∞'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted">days left</p>
            </>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
}
