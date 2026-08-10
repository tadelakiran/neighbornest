import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, MapPin, Users } from 'lucide-react';
import { NestStatusBadge } from '@/components/matching/NestStatusBadge';
import { NestEmptyState } from '@/components/nest/NestEmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cardStagger, cardRise } from '@/lib/motion';
import { nestDetailPath } from '@/lib/constants';
import { getMyNests } from '@/services/nestService';
import { formatDate } from '@/lib/utils';
import type { NestResponse } from '@/types/nest.types';

/** Splits the user's Nests into active and graduated buckets. */
function splitNests(nests: NestResponse[]): { active: NestResponse[]; graduated: NestResponse[] } {
  return {
    active: nests.filter((n) => n.status !== 'GRADUATED'),
    graduated: nests.filter((n) => n.status === 'GRADUATED'),
  };
}

/**
 * All of the user's Nests (active + graduated) as a card grid. Empty state
 * funnels to Discover via NestEmptyState.
 */
export function NestsPage() {
  const navigate = useNavigate();
  const [nests, setNests] = useState<NestResponse[] | null>(null);

  useEffect(() => {
    let active = true;
    getMyNests()
      .then((data) => active && setNests(data))
      .catch(() => active && setNests([]));
    return () => {
      active = false;
    };
  }, []);

  const { active, graduated } = useMemo(() => splitNests(nests ?? []), [nests]);

  if (nests === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (nests.length === 0) {
    return (
      <motion.div variants={cardStagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={cardRise}>
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">My Nest</h1>
          <p className="mt-1 text-secondary">Your small curated groups — where your people live.</p>
        </motion.div>
        <NestEmptyState />
      </motion.div>
    );
  }

  const renderCard = (nest: NestResponse) => {
    const memberCount = nest.members.filter((m) => m.status === 'ACCEPTED').length;
    return (
      <motion.button
        key={nest.id}
        variants={cardRise}
        whileHover={{ y: -5 }}
        onClick={() => navigate(nestDetailPath(nest.id))}
        className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card-gradient p-6 text-left backdrop-blur-xl transition-shadow duration-300 hover:shadow-card-hover"
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/50 to-transparent" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-bold text-primary transition-colors group-hover:text-accent-300">
              {nest.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3 w-3 text-accent-400" aria-hidden="true" />
              {nest.city}
            </p>
          </div>
          <NestStatusBadge status={nest.status} />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
            <Users className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
            {memberCount} member{memberCount === 1 ? '' : 's'}
          </span>
          {nest.startDate && (
            <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
              <CalendarDays className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
              Since {formatDate(nest.startDate)}
            </span>
          )}
          <ArrowRight className="h-4 w-4 text-accent-400 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </motion.button>
    );
  };

  return (
    <motion.div variants={cardStagger} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={cardRise}>
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">My Nest</h1>
        <p className="mt-1 text-secondary">Your small curated groups — where your people live.</p>
      </motion.div>

      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Active</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {active.map(renderCard)}
          </div>
        </section>
      )}

      {graduated.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Graduated</h2>
          <div className="grid grid-cols-1 gap-5 opacity-80 md:grid-cols-2">
            {graduated.map(renderCard)}
          </div>
        </section>
      )}
    </motion.div>
  );
}
