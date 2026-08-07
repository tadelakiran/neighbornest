import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Home, MapPin, Users } from 'lucide-react';
import { NestStatusBadge } from '@/components/matching/NestStatusBadge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cardStagger, cardRise } from '@/lib/motion';
import { nestDetailPath, ROUTES } from '@/lib/constants';
import { getMyNests } from '@/services/nestService';
import type { NestSummaryResponse } from '@/types/nest.types';

export function MyNestsPage() {
  const navigate = useNavigate();
  const [nests, setNests] = useState<NestSummaryResponse[] | null>(null);

  useEffect(() => {
    let active = true;
    getMyNests()
      .then((data) => active && setNests(data))
      .catch(() => active && setNests([]));
    return () => {
      active = false;
    };
  }, []);

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

  return (
    <motion.div variants={cardStagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={cardRise}>
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">My Nest</h1>
        <p className="mt-1 text-secondary">Your small curated groups — where your people live.</p>
      </motion.div>

      {nests.length === 0 ? (
        <motion.div
          variants={cardRise}
          className="flex flex-col items-center rounded-3xl border border-white/[0.08] bg-deep/60 px-8 py-16 text-center"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow">
            <Home className="h-8 w-8 text-white" aria-hidden="true" />
          </span>
          <h2 className="mt-6 font-display text-xl font-bold text-primary">You're not in a Nest yet</h2>
          <p className="mt-2 max-w-sm text-sm text-secondary">
            Start matching to get placed into a curated Nest with compatible neighbors and a local Anchor.
          </p>
          <Button
            variant="primary"
            className="mt-6 shadow-glow"
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            onClick={() => navigate(ROUTES.DISCOVER)}
          >
            Start matching
          </Button>
        </motion.div>
      ) : (
        <motion.div variants={cardStagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {nests.map((nest) => (
            <motion.button
              key={nest.id}
              variants={cardRise}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
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
                  {nest.memberCount} members
                </span>
                {nest.nextMeetingDate ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
                    <CalendarDays className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                    Next meeting scheduled
                  </span>
                ) : (
                  <span className="text-xs text-muted">No meetings yet</span>
                )}
                <ArrowRight
                  className="h-4 w-4 text-accent-400 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
