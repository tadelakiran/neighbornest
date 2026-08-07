import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Construction, MapPin, Star, Wrench } from 'lucide-react';
import { NestStatusBadge } from '@/components/matching/NestStatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { cardStagger, cardRise } from '@/lib/motion';
import { getNestById } from '@/services/nestService';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { NestDetailResponse } from '@/types/nest.types';

/** Days remaining until a date (or "Ongoing" when absent). */
function daysRemaining(endDate?: string): string {
  if (!endDate) return 'Ongoing';
  const diff = new Date(endDate).getTime() - Date.now();
  if (Number.isNaN(diff)) return '—';
  if (diff <= 0) return 'Graduated';
  const days = Math.ceil(diff / 86_400_000);
  return `${days} day${days === 1 ? '' : 's'} left`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NestDetailPage() {
  const { nestId } = useParams<{ nestId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [nest, setNest] = useState<NestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!nestId) return;
    let active = true;
    setLoading(true);
    getNestById(nestId)
      .then((data) => active && setNest(data))
      .catch(() => active && setNest(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [nestId]);

  const handleSchedule = () =>
    toast.info('Meeting scheduling arrives in the next update — your Nest will be ready!');

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!nest) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-white/[0.08] bg-deep/60 px-8 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <Construction className="h-8 w-8 text-muted" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-primary">Nest not found</h1>
        <p className="mt-2 max-w-sm text-sm text-secondary">
          This Nest may not exist yet, or matching hasn't placed you in one. Head to Discover to start matching.
        </p>
        <Button variant="primary" className="mt-6" onClick={() => navigate(ROUTES.DISCOVER)}>
          Go to Discover
        </Button>
      </div>
    );
  }

  const anchor = nest.members.find((m) => m.roleInNest === 'ANCHOR');
  const memberCount = nest.members.length;

  return (
    <motion.div variants={cardStagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={cardRise}>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary">{nest.name}</h1>
          <NestStatusBadge status={nest.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-secondary">
          <MapPin className="h-4 w-4 text-accent-400" aria-hidden="true" />
          {nest.city}
          {nest.neighborhood ? ` · ${nest.neighborhood}` : ''}
          <span className="text-white/10">•</span>
          {memberCount} member{memberCount === 1 ? '' : 's'}
          {anchor ? ` · Anchored by ${anchor.fullName}` : ''}
        </p>
      </motion.div>

      {/* Info cards */}
      <motion.div variants={cardRise} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: CalendarDays, label: 'Start date', value: formatDate(nest.startDate) },
          { icon: CalendarDays, label: 'End date', value: formatDate(nest.endDate) },
          { icon: Clock, label: 'Days remaining', value: daysRemaining(nest.endDate) },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-deep/60 p-4 backdrop-blur-xl"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-400/10">
              <Icon className="h-5 w-5 text-accent-300" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-primary">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Members */}
      <motion.div variants={cardRise}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">Members</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {nest.members.map((member) => {
            const isAnchor = member.roleInNest === 'ANCHOR';
            return (
              <div
                key={member.userId}
                className={cn(
                  'flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-200',
                  isAnchor
                    ? 'border-amber-400/30 bg-amber-400/[0.06] hover:border-amber-400/50'
                    : 'border-white/[0.08] bg-deep/60 hover:border-accent-400/30'
                )}
              >
                <Avatar name={member.fullName} src={member.profilePhotoUrl} size="xl" />
                <p className="mt-3 text-sm font-semibold text-primary">{member.fullName}</p>
                <span
                  className={cn(
                    'mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    isAnchor
                      ? 'border border-amber-400/40 bg-amber-400/10 text-amber-300'
                      : 'border border-white/[0.06] bg-white/[0.03] text-muted'
                  )}
                >
                  {isAnchor && <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />}
                  {member.roleInNest}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Coming-soon banner + CTA */}
      <motion.div variants={cardRise}>
        <div className="relative overflow-hidden rounded-2xl border border-accent-400/25 bg-accent-400/[0.06] p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/60 to-transparent" aria-hidden="true" />
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-400/10">
                <Wrench className="h-5 w-5 text-accent-300" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-primary">Meetings, Expenses & Chat — coming soon</h2>
                <p className="mt-0.5 text-sm text-secondary">
                  Scheduling, shared expenses, vibe checks and Nest chat land in the next update.
                </p>
              </div>
            </div>
            <div className="group relative">
              <Button variant="primary" size="md" disabled onClick={handleSchedule} className="opacity-50">
                Schedule First Meeting
              </Button>
              <span
                role="tooltip"
                className="pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-lg border border-white/10 bg-raised px-3 py-1.5 text-xs text-secondary opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
              >
                Coming in next update
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
