import { motion } from 'framer-motion';
import { Check, MapPin, Sparkles, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cardRise } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { CompatibleUserResponse } from '@/types/matching.types';

interface CompatibilityCardProps {
  user: CompatibleUserResponse;
  /** Fired when the user toggles this match in/out of their Nest invite. */
  onInvite?: (user: CompatibleUserResponse) => void;
  /** Fired when the user skips this match. */
  onSkip?: (user: CompatibleUserResponse) => void;
  /** Whether this match is currently selected for the Nest invite. */
  invited?: boolean;
  /** Disables the action buttons (e.g. while a request is in flight). */
  busy?: boolean;
  className?: string;
}

const BAR_STYLES = [
  { label: 'Values',    color: 'bg-accent-400' },
  { label: 'Lifestyle', color: 'bg-accent-500' },
  { label: 'Interests', color: 'bg-accent-300' },
] as const;

/**
 * Single compatibility card for the Discover page. Shows the match's photo,
 * location, an animated score, a mini values/lifestyle/interest breakdown,
 * interest pills, and Invite/Skip actions. Enters with a rise from below
 * (staggered by the parent grid).
 */
export function CompatibilityCard({ user, onInvite, onSkip, invited = false, busy = false, className }: CompatibilityCardProps) {
  const breakdown = [
    user.valuesScore ?? 0,
    user.lifestyleScore ?? 0,
    user.interestScore ?? 0,
  ];

  return (
    <motion.article
      variants={cardRise}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'border border-white/[0.08] bg-deep/60 backdrop-blur-xl',
        'shadow-lg transition-shadow duration-300 hover:shadow-card-hover',
        className
      )}
    >
      {/* Top gradient wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-accent-500/15 to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex flex-1 flex-col p-5">
        {/* Avatar + online ring */}
        <div className="relative mx-auto mt-1">
          <span className="absolute -inset-1 rounded-full bg-accent-400/20 blur-lg" aria-hidden="true" />
          <span className="relative block rounded-full p-0.5 ring-2 ring-accent-400/60">
            <Avatar name={user.fullName} src={user.profilePhotoUrl} size="xl" />
          </span>
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--color-deep)] bg-emerald-400" aria-hidden="true" />
        </div>

        {/* Name + location */}
        <h3 className="mt-3 text-center font-display text-xl font-bold text-primary">{user.fullName}</h3>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-secondary">
          <MapPin className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
          {user.city}
        </p>

        {/* Score + mini bars */}
        <div className="mt-4 flex items-end justify-center gap-1.5">
          <span className="font-display text-5xl font-bold leading-none text-primary">
            {Math.round(user.overallScore)}
          </span>
          <span className="pb-1 font-display text-lg font-bold text-accent-400">%</span>
        </div>
        <div className="mt-4 space-y-2">
          {BAR_STYLES.map((bar, i) => (
            <div key={bar.label} className="flex items-center gap-2">
              <span className="w-16 text-[10px] font-medium uppercase tracking-wider text-muted">{bar.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${breakdown[i]}%` }}
                  transition={{ duration: 0.9, delay: 0.35 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('h-full rounded-full', bar.color)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Interest pills */}
        {user.interests.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {user.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-white/5 bg-surface px-2.5 py-1 text-xs text-secondary"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center gap-2">
          <Button
            variant={invited ? 'outline' : 'primary'}
            size="sm"
            fullWidth
            disabled={busy}
            leftIcon={
              invited ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )
            }
            onClick={() => onInvite?.(user)}
            className={invited ? 'border-accent-400/40 text-accent-300' : 'shadow-glow'}
          >
            {invited ? 'Selected' : 'Invite to Nest'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
            onClick={() => onSkip?.(user)}
            aria-label={`Skip ${user.fullName}`}
          >
            Skip
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
