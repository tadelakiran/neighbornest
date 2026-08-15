import { motion } from 'framer-motion';
import { Check, MapPin, Sparkles, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cardRise } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { CompatibleUserResponse } from '@/types/matching.types';

interface CompatibilityCardProps {
  user: CompatibleUserResponse;
  onInvite?: (user: CompatibleUserResponse) => void;
  onSkip?: (user: CompatibleUserResponse) => void;
  invited?: boolean;
  busy?: boolean;
  className?: string;
}

const BAR_STYLES = [
  { label: 'Values',    color: 'bg-accent-400', glow: 'shadow-[0_0_8px_rgba(56,189,248,0.35)]' },
  { label: 'Lifestyle', color: 'bg-accent-500', glow: 'shadow-[0_0_8px_rgba(14,165,233,0.35)]' },
  { label: 'Interests', color: 'bg-accent-300', glow: 'shadow-[0_0_8px_rgba(125,211,252,0.35)]' },
] as const;

export function CompatibilityCard({ user, onInvite, onSkip, invited = false, busy = false, className }: CompatibilityCardProps) {
  const breakdown = [
    user.valuesScore ?? 0,
    user.lifestyleScore ?? 0,
    user.interestScore ?? 0,
  ];

  return (
    <motion.article
      variants={cardRise}
      whileHover={{ y: -5, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'border border-[var(--color-border)] bg-[var(--color-deep)]/70 backdrop-blur-xl',
        'shadow-lg shadow-black/20 transition-all duration-300',
        'hover:border-accent-400/20 hover:shadow-xl hover:shadow-black/30',
        className
      )}
    >
      {/* Top gradient wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-accent-500/12 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Subtle inner glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(400px circle at 50% 0%, rgba(14,165,233,0.06), transparent 60%)',
        }}
      />

      <div className="relative flex flex-1 flex-col p-5">
        {/* Avatar */}
        <div className="relative mx-auto mt-1">
          <span
            className="absolute -inset-1.5 rounded-full bg-accent-400/15 blur-xl transition-all duration-300 group-hover:bg-accent-400/25"
            aria-hidden="true"
          />
          <span className="relative block rounded-full p-[2px] ring-[1.5px] ring-accent-400/50 transition-all duration-300 group-hover:ring-accent-400/70">
            <Avatar name={user.fullName} src={user.profilePhotoUrl} size="xl" />
          </span>
          {/* Online indicator */}
          <span
            className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-[2.5px] border-deep bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]"
            aria-hidden="true"
          />
        </div>

        {/* Name + location */}
        <h3 className="mt-3 text-center font-display text-xl font-bold tracking-tight text-primary">
          {user.fullName}
        </h3>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-secondary">
          <MapPin className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
          {user.city}
        </p>

        {/* Score */}
        <div className="mt-5 flex items-end justify-center gap-1">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="font-display text-5xl font-bold leading-none text-primary"
          >
            {Math.round(user.overallScore)}
          </motion.span>
          <span className="pb-1 font-display text-lg font-bold text-accent-400">%</span>
        </div>

        {/* Mini bars */}
        <div className="mt-5 space-y-2.5">
          {BAR_STYLES.map((bar, i) => (
            <div key={bar.label} className="flex items-center gap-3">
              <span className="w-[3.25rem] text-[10px] font-semibold uppercase tracking-wider text-muted">
                {bar.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-raised)]/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${breakdown[i]}%` }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('h-full rounded-full', bar.color, bar.glow)}
                />
              </div>
              <span className="w-8 text-right text-[10px] font-bold text-muted">
                {Math.round(breakdown[i])}
              </span>
            </div>
          ))}
        </div>

        {/* Interest pills */}
        {user.interests.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {user.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--accent-400)]/20 hover:text-[var(--text-primary)]"
              >
                {interest}
              </span>
            ))}
            {user.interests.length > 4 && (
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]">
                +{user.interests.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-5">
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
            className={cn(
              'rounded-xl transition-all duration-200',
              invited
                ? 'border-accent-400/30 bg-accent-400/10 text-accent-300 hover:bg-accent-400/15'
                : 'shadow-glow hover:shadow-[0_0_24px_rgba(14,165,233,0.35)]'
            )}
          >
            {invited ? 'Selected' : 'Invite to Nest'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
            onClick={() => onSkip?.(user)}
            className="rounded-xl text-[var(--text-muted)] hover:bg-[var(--error)]/10 hover:text-[var(--error)]"
            aria-label={`Skip ${user.fullName}`}
          >
            Skip
          </Button>
        </div>
      </div>
    </motion.article>
  );
}