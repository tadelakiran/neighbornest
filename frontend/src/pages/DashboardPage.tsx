import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Compass, Home, Inbox, MapPin, Sparkles, Sprout, Users } from 'lucide-react';
import { BentoGrid } from '@/components/dashboard/BentoGrid';
import { BentoCard } from '@/components/dashboard/BentoCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { MeetingPreview, type MeetingPreviewData } from '@/components/dashboard/MeetingPreview';
import { ActivityTimeline, type TimelineEvent } from '@/components/matching/ActivityTimeline';
import { CircularScore } from '@/components/matching/CircularScore';
import { MemberAvatarStack } from '@/components/matching/MemberAvatarStack';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useToast } from '@/hooks/useToast';
import { cardStagger, cardRise } from '@/lib/motion';
import { IMAGES } from '@/lib/images';
import { ROUTES, nestDetailPath } from '@/lib/constants';
import { calculateCompatibility, getCompatibles, getPendingProposals } from '@/services/matchingService';
import { getMyNests } from '@/services/nestService';
import type { CompatibleUserResponse, MatchProposalResponse } from '@/types/matching.types';
import type { NestResponse } from '@/types/nest.types';

/** Time-of-day greeting for the welcome header. */
function greetingFor(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Computes which week (1-6) of the guided journey we're in for a Nest's
 * lifecycle. Falls back to null when the dates are missing or invalid.
 */
function journeyWeek(startDate?: string, endDate?: string): number | null {
  if (!startDate) return null;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return null;
  if (endDate && new Date(endDate).getTime() < Date.now()) return 6;
  const elapsedWeeks = Math.floor((Date.now() - start) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(6, Math.max(1, elapsedWeeks + 1));
}

/**
 * The dashboard renders the bento grid immediately — the header and hero card
 * need no data, and each remaining cell shows its own shimmer skeleton until
 * its specific API call resolves. Nothing waits for the slowest request.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const userId = user?.authUserId ?? user?.id;
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  // ── Data (all calls tolerate a missing backend and degrade to empty states) ──
  const [compatibles, setCompatibles] = useState<CompatibleUserResponse[] | null>(null);
  const [proposals, setProposals] = useState<MatchProposalResponse[] | null>(null);
  const [nests, setNests] = useState<NestResponse[] | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!userId) {
      setCompatibles([]);
      setProposals([]);
      setNests([]);
      return;
    }
    let active = true;
    getCompatibles(userId)
      .then((d) => active && setCompatibles(d))
      .catch(() => active && setCompatibles([]));
    getPendingProposals(userId)
      .then((d) => active && setProposals(d))
      .catch(() => active && setProposals([]));
    getMyNests()
      .then((d) => active && setNests(d))
      .catch(() => active && setNests([]));
    return () => {
      active = false;
    };
  }, [userId]);

  const typedGreeting = useTypewriter(`${greetingFor(new Date().getHours())}, ${firstName}`);

  // ── Derived data for the bento cells ──
  const bestMatch = useMemo(() => {
    if (!compatibles || compatibles.length === 0) return null;
    return [...compatibles].sort((a, b) => b.overallScore - a.overallScore)[0];
  }, [compatibles]);

  const proposalMembers = useMemo(
    () => proposals?.flatMap((p) => p.members).slice(0, 5) ?? [],
    [proposals]
  );

  // The nest endpoint does not expose a next-meeting date, so the preview
  // stays empty until the Nest Hub ships meeting data of its own.
  const meetings: MeetingPreviewData[] = useMemo(() => [], []);

  const citiesExplored = useMemo(() => {
    const cities = new Set<string>();
    if (user?.city) cities.add(user.city);
    compatibles?.forEach((c) => c.city && cities.add(c.city));
    return cities.size;
  }, [compatibles, user?.city]);

  /** First active Nest drives the journey card; falls back to any nest. */
  const activeNest = useMemo(
    () => nests?.find((n) => n.status === 'ACTIVE') ?? nests?.[0] ?? null,
    [nests]
  );
  const week = useMemo(
    () => (activeNest ? journeyWeek(activeNest.startDate, activeNest.endDate) : null),
    [activeNest]
  );

  const activity: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];
    if (nests && nests.length > 0) {
      events.push({
        id: 'a-nest',
        title: `Joined ${nests[0].name}`,
        description: `You're now part of a Nest in ${nests[0].city}.`,
        time: 'Today',
        category: 'nest',
      });
    }
    if (proposals && proposals.length > 0) {
      events.push({
        id: 'a-proposal',
        title: 'Received a Nest invitation',
        description: `${proposals[0].members.length} people want you to join their group.`,
        time: 'Today',
        category: 'proposal',
      });
    }
    if (compatibles && compatibles.length > 0) {
      events.push({
        id: 'a-match',
        title: 'Matches calculated',
        description: `We found ${compatibles.length} compatible neighbor${compatibles.length === 1 ? '' : 's'} for you.`,
        time: 'Today',
        category: 'system',
      });
    }
    if (events.length === 0) {
      events.push({
        id: 'a-start',
        title: 'Welcome to NeighborNest',
        description: 'Start matching to find your people and join your first Nest.',
        time: 'Now',
        category: 'system',
      });
    }
    return events;
  }, [compatibles, nests, proposals]);

  // ── Actions ──
  const handleStartMatching = async () => {
    if (!userId || calculating) return;
    setCalculating(true);
    try {
      await calculateCompatibility(userId);
      toast.success('Compatibility calculated — here are your matches!');
      navigate(ROUTES.DISCOVER);
    } catch {
      toast.error('Could not calculate matches right now. Please try again.');
      setCalculating(false);
    }
  };

  return (
    <motion.div variants={cardStagger} initial="hidden" animate="show" className="space-y-6">
      {/* ── Welcome header ── */}
      <motion.div
        variants={cardRise}
        className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3"
      >
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">
            {typedGreeting}
            <span className="text-accent-400">.</span>
          </h1>
          <p className="mt-1 text-secondary">Let&apos;s find your people.</p>
        </div>

        {/* Context chips — city + role, aligned to the baseline of the heading */}
        <div className="flex flex-wrap items-center gap-2">
          {user?.city && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-secondary">
              <MapPin className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
              {user.city}
            </span>
          )}
          {user?.role && (
            <span className="inline-flex items-center rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-semibold capitalize text-gold-300">
              <Sprout className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {user.role.toLowerCase()}
            </span>
          )}
        </div>
      </motion.div>

      <BentoGrid>
        {/* ── Find Your Nest (2x1) ── */}
        <BentoCard size="2x1">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <LazyImage
              src={IMAGES.city}
              alt=""
              placeholder="shimmer"
              wrapperClassName="absolute inset-0"
              className="h-full w-full object-cover opacity-30"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/40" />
          </div>
          <div className="relative flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <motion.span
                animate={{ rotate: [0, 12, -12, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow"
              >
                <Compass className="h-7 w-7 text-white" aria-hidden="true" />
              </motion.span>
              <div>
                <h2 className="font-display text-xl font-bold text-primary">Find Your Nest</h2>
                <p className="mt-1 max-w-md text-sm text-secondary">
                  We match you with compatible neighbors, then place you in a small curated Nest with a local Anchor.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              isLoading={calculating}
              rightIcon={!calculating ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : undefined}
              onClick={() => void handleStartMatching()}
              className="shrink-0 shadow-glow"
            >
              {calculating ? 'Calculating…' : 'Start Matching'}
            </Button>
          </div>
          {calculating && (
            <div className="relative mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60">
              <div className="h-2 w-full animate-pulse bg-accent-400/20" />
            </div>
          )}
        </BentoCard>

        {/* ── Compatibility Score (1x1) ── */}
        <BentoCard size="1x1">
          {compatibles === null ? (
            <CardSkeleton />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <CircularScore value={bestMatch?.overallScore ?? 0} size={128} label="match" />
              <div className="text-center">
                <p className="text-sm font-semibold text-primary">
                  {bestMatch ? `Top match: ${bestMatch.fullName.split(' ')[0]}` : 'No matches yet'}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {bestMatch ? `${bestMatch.city} · ${Math.round(bestMatch.overallScore)}% compatible` : 'Run a calculation to see your score'}
                </p>
              </div>
            </div>
          )}
        </BentoCard>

        {/* ── Recent Activity (2x1) ── */}
        <BentoCard size="2x1">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted">
            <Sparkles className="h-4 w-4 text-accent-400" aria-hidden="true" />
            Recent Activity
          </h2>
          {compatibles === null || proposals === null || nests === null ? (
            <div className="space-y-3">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : (
            <ActivityTimeline events={activity} />
          )}
        </BentoCard>

        {/* ── Active Proposals (1x1) ── */}
        <BentoCard size="1x1">
          {proposals === null ? (
            <CardSkeleton />
          ) : (
            <button
              onClick={() => navigate(ROUTES.PROPOSALS)}
              className="flex h-full w-full flex-col items-start justify-center gap-3 text-left"
              aria-label="View your nest invitations"
            >
              <div className="flex items-center justify-between self-stretch">
                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Inbox className="h-4 w-4 text-accent-400" aria-hidden="true" />
                  Active Proposals
                </span>
                {proposals.length > 0 && (
                  <span className="glow-dot h-2.5 w-2.5" aria-hidden="true" />
                )}
              </div>
              {proposals.length > 0 ? (
                <>
                  <MemberAvatarStack members={proposalMembers} size="sm" />
                  <p className="text-xs text-muted">
                    {proposals.length} invitation{proposals.length === 1 ? '' : 's'} waiting for your reply
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">No pending invitations. Keep your profile fresh for better invites.</p>
              )}
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-accent-300 transition-colors hover:text-accent-400">
                View invitations <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </button>
          )}
        </BentoCard>

        {/* ── Quick Stats (1x1) ── */}
        <BentoCard size="1x1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">Quick Stats</h2>
          {nests === null || compatibles === null ? (
            <div className="flex flex-1 flex-col justify-center gap-4">
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-4">
              <StatCard label="Nests joined" value={nests?.length ?? 0} icon={Home} delay={100} />
              <StatCard label="Friends made" value={compatibles?.length ?? 0} icon={Users} delay={200} />
              <StatCard label="Cities explored" value={citiesExplored} icon={MapPin} delay={300} />
            </div>
          )}
        </BentoCard>

        {/* ── Upcoming Meetings (1x1) ── */}
        <BentoCard size="1x1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">Upcoming Meetings</h2>
          {nests === null ? (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : meetings.length > 0 ? (
            <div className="flex flex-1 flex-col gap-3">
              {meetings.slice(0, 2).map((meeting) => (
                <MeetingPreview key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <button
              onClick={() => navigate(ROUTES.MY_NEST)}
              className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border-2)] p-4 text-center transition-colors hover:border-accent-400/40 hover:bg-accent-400/[0.04]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface-2)]">
                <CalendarDays className="h-5 w-5 text-accent-400" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-primary">No meetings scheduled yet</p>
              <p className="text-xs text-muted">Open your Nest to plan the first meetup.</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-300">
                Open Nest <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </button>
          )}
        </BentoCard>

        {/* ── 6-Week Journey (1x1 desktop / 2x1 tablet) ── */}
        <BentoCard size="1x1" className="md:col-span-2 lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted">
            <Sprout className="h-4 w-4 text-gold-400" aria-hidden="true" />
            Your 6-Week Journey
          </h2>
          {nests === null ? (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
            </div>
          ) : activeNest && week ? (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl font-bold text-primary">
                  Week <span className="text-gradient-gold">{week}</span> of 6
                </p>
                <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-300">
                  {Math.round((week / 6) * 100)}% there
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]"
                role="progressbar"
                aria-valuenow={week}
                aria-valuemin={1}
                aria-valuemax={6}
                aria-label="Journey progress"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(week / 6) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gold-gradient"
                />
              </div>
              <p className="truncate text-xs text-secondary">
                <span className="font-semibold text-primary">{activeNest.name}</span>
                {activeNest.city ? ` · ${activeNest.city}` : ''}
              </p>
              <button
                onClick={() => navigate(nestDetailPath(activeNest.id))}
                className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-gold-300 transition-colors hover:text-gold-200"
              >
                Open Nest <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate(ROUTES.DISCOVER)}
              className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border-2)] p-4 text-center transition-colors hover:border-gold-400/40 hover:bg-gold-400/[0.04]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface-2)]">
                <Sprout className="h-5 w-5 text-gold-400" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-primary">Not in a Nest yet</p>
              <p className="text-xs text-muted">Run a match and your 6-week journey begins.</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-300">
                Discover matches <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </button>
          )}
        </BentoCard>
      </BentoGrid>
    </motion.div>
  );
}

/** Compact shimmer placeholder for a data-dependent bento cell. */
function CardSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-4 w-2/3 rounded-lg" />
      <Skeleton className="h-3 w-1/2 rounded-lg" />
    </div>
  );
}
