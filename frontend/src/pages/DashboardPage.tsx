import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Home,
  Inbox,
  LayoutGrid,
  MapPin,
  Sparkles,
  Sprout,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { BentoGrid } from '@/components/dashboard/BentoGrid';
import { BentoCard } from '@/components/dashboard/BentoCard';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { MeetingPreview, type MeetingPreviewData } from '@/components/dashboard/MeetingPreview';
import { ActivityTimeline, type TimelineEvent } from '@/components/matching/ActivityTimeline';
import { CircularScore } from '@/components/matching/CircularScore';
import { MemberAvatarStack } from '@/components/matching/MemberAvatarStack';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useToast } from '@/hooks/useToast';
import { cardStagger } from '@/lib/motion';
import { IMAGES } from '@/lib/images';
import { portraitFor } from '@/lib/avatars';
import { ROUTES, nestDetailPath } from '@/lib/constants';
import {
  calculateCompatibility,
  getCompatibles,
  getPendingProposals,
} from '@/services/matchingService';
import { getMyNests } from '@/services/nestService';
import type { CompatibleUserResponse, MatchProposalResponse } from '@/types/matching.types';
import type { NestResponse } from '@/types/nest.types';

function greetingFor(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function journeyWeek(startDate?: string, endDate?: string): number | null {
  if (!startDate) return null;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return null;
  if (endDate && new Date(endDate).getTime() < Date.now()) return 6;
  const elapsedWeeks = Math.floor((Date.now() - start) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(6, Math.max(1, elapsedWeeks + 1));
}

/** Small uppercase zone label with a hairline rule — groups related cards. */
function ZoneHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-muted">
        {children}
      </h2>
      <div className="h-px flex-1 bg-[var(--color-border)]" aria-hidden="true" />
    </div>
  );
}

/** Shared card heading — one heading style across every dashboard card. */
function CardTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted">
      <Icon className="h-4 w-4 text-accent-400" aria-hidden="true" />
      {children}
    </h3>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const userId = user?.id ?? user?.authUserId;
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

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

  const bestMatch = useMemo(() => {
    if (!compatibles || compatibles.length === 0) return null;
    return [...compatibles].sort((a, b) => b.overallScore - a.overallScore)[0];
  }, [compatibles]);

  /** Invitation members with a realistic portrait fallback for the avatar stack. */
  const proposalMembers = useMemo(
    () =>
      proposals
        ?.flatMap((p) => p.members)
        .slice(0, 5)
        .map((m) => ({ ...m, profilePhotoUrl: m.profilePhotoUrl ?? portraitFor(m.userId) })) ?? [],
    [proposals]
  );

  const meetings: MeetingPreviewData[] = useMemo(() => [], []);

  const citiesExplored = useMemo(() => {
    const cities = new Set<string>();
    if (user?.city) cities.add(user.city);
    compatibles?.forEach((c) => c.city && cities.add(c.city));
    return cities.size;
  }, [compatibles, user?.city]);

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
    if (nests?.length) {
      events.push({
        id: 'a-nest',
        title: `Joined ${nests[0].name}`,
        description: `You're now part of a Nest in ${nests[0].city}.`,
        time: 'Today',
        category: 'nest',
      });
    }
    if (proposals?.length) {
      events.push({
        id: 'a-proposal',
        title: 'Received a Nest invitation',
        description: `${proposals[0].members.length} people want you to join their group.`,
        time: 'Today',
        category: 'proposal',
      });
    }
    if (compatibles?.length) {
      events.push({
        id: 'a-match',
        title: 'Matches calculated',
        description: `We found ${compatibles.length} compatible neighbor${compatibles.length === 1 ? '' : 's'} for you.`,
        time: 'Today',
        category: 'system',
      });
    }
    if (!events.length) {
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

  const nestStatusLabel = activeNest
    ? `${activeNest.status.charAt(0)}${activeNest.status.slice(1).toLowerCase()}`
    : '';

  return (
    <div className="flex w-full items-start gap-6">
      {/* Sidebar — tablet & up; bottom tab bar covers phones */}
      <DashboardSidebar />

      <div className="min-w-0 flex-1 space-y-8">
        {/* ── Welcome header ── */}
        <PageHeader
          title={
            <>
              {typedGreeting}
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="text-[var(--accent-400)]"
              >
                .
              </motion.span>
            </>
          }
          description="Let's find your people."
          actions={
            <>
              {user?.city && (
                <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--accent-400)]" aria-hidden="true" />
                  {user.city}
                </span>
              )}
              {user?.role && (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--royal-500)]/20 bg-[var(--royal-500)]/10 px-3 py-1.5 text-xs font-semibold capitalize text-[var(--royal-300)]">
                  <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
                  {user.role.toLowerCase()}
                </span>
              )}
            </>
          }
        />

        <div className="space-y-10">
          {/* ══ Hero — Primary action zone ══ */}
          <motion.div variants={cardStagger} initial="hidden" animate="show">
            <BentoGrid>
              <BentoCard className="md:col-span-2 lg:col-span-12">
                <div className="relative flex flex-1 flex-col gap-8 md:flex-row md:items-center">
                  {/* Copy + single strong CTA — separate from the photo */}
                  <div className="flex flex-1 flex-col items-start gap-4 py-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-400)]">
                      Neighborhood matching
                    </p>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-primary md:text-3xl">
                      Find your Nest.
                    </h2>
                    <p className="max-w-xl text-sm leading-relaxed text-secondary">
                      We match you with compatible neighbors, then place you in a small curated
                      Nest with a local Anchor.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      isLoading={calculating}
                      rightIcon={
                        !calculating ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : undefined
                      }
                      onClick={() => void handleStartMatching()}
                      className="mt-1 shadow-glow"
                    >
                      {calculating ? 'Calculating…' : 'Start Matching'}
                    </Button>
                  </div>

                  {/* Supporting photo with a soft fade so image never competes with text */}
                  <div className="relative h-44 shrink-0 overflow-hidden rounded-[var(--radius-lg)] md:h-52 md:w-72 lg:w-80">
                    <LazyImage
                      src={IMAGES.city}
                      alt="A vibrant city neighborhood"
                      placeholder="shimmer"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-[#ffffff] via-[#ffffff]/10 to-transparent"
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/25 via-transparent to-transparent"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {calculating && (
                  <div className="relative mt-4 overflow-hidden rounded-xl bg-surface-2/60">
                    <motion.div
                      className="h-1.5 bg-accent-gradient"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </BentoCard>
            </BentoGrid>
          </motion.div>

          {/* ══ Your Progress — Match % + Journey ══ */}
          <motion.section
            variants={cardStagger}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            <ZoneHeading>Your Progress</ZoneHeading>
            <BentoGrid>
              {/* Match Score — primary metric */}
              <BentoCard className="md:col-span-1 lg:col-span-4">
                {compatibles === null ? (
                  <CardSkeleton />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-5 py-1 text-center">
                    <div className="relative">
                      <CircularScore value={bestMatch?.overallScore ?? 0} size={132} label="match" />
                      {bestMatch && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                          className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent-gradient shadow-glow-sm"
                        >
                          <Zap className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                        </motion.div>
                      )}
                    </div>
                    {bestMatch ? (
                      <div className="flex flex-col items-center gap-2.5">
                        <Avatar
                          name={bestMatch.fullName}
                          src={bestMatch.profilePhotoUrl ?? portraitFor(bestMatch.userId)}
                          size="md"
                        />
                        <div>
                          <p className="text-sm font-semibold text-primary">
                            Top match: {bestMatch.fullName.split(' ')[0]}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {bestMatch.city} · {Math.round(bestMatch.overallScore)}% compatible
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-primary">No matches yet</p>
                        <p className="mt-0.5 text-xs text-muted">
                          Run a calculation to see your score
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </BentoCard>

              {/* 6-Week Journey — secondary progress, hosts the only "Open Nest" CTA */}
              <BentoCard className="md:col-span-1 lg:col-span-8">
                <div className="flex h-full flex-col gap-5">
                  <CardTitle icon={Sprout}>6-Week Journey</CardTitle>
                  {nests === null ? (
                    <div className="flex flex-1 flex-col justify-center gap-3">
                      <Skeleton className="h-12 rounded-xl" />
                      <Skeleton className="h-4 w-2/3 rounded-lg" />
                    </div>
                  ) : activeNest && week ? (
                    <div className="flex flex-1 flex-col justify-center gap-6 sm:flex-row sm:items-center sm:gap-10">
                      {/* Week + progress */}
                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="font-display text-3xl font-bold leading-none text-primary">
                              Week <span className="text-gradient">{week}</span>
                            </p>
                            <p className="mt-1.5 text-xs text-muted">of your 6-week Nest journey</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                            {Math.round((week / 6) * 100)}%
                          </span>
                        </div>
                        <div
                          className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
                          role="progressbar"
                          aria-valuenow={week}
                          aria-valuemin={1}
                          aria-valuemax={6}
                          aria-label="Journey progress"
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(week / 6) * 100}%` }}
                            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-accent-gradient shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                          />
                        </div>
                      </div>

                      {/* Nest summary + the single contextual Open Nest CTA */}
                      <div className="flex shrink-0 flex-row items-center gap-4 sm:flex-col sm:items-end sm:gap-3">
                        <div className="min-w-0 sm:text-right">
                          <p className="truncate text-sm font-semibold text-primary">
                            {activeNest.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {activeNest.city}
                            {activeNest.status !== 'ACTIVE' ? ` · ${nestStatusLabel}` : ''}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="md"
                          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                          onClick={() => navigate(nestDetailPath(activeNest.id))}
                          className="shrink-0"
                        >
                          Open Nest
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center sm:flex-row sm:gap-6">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-400/10">
                        <Sprout className="h-5 w-5 text-sky-400" aria-hidden="true" />
                      </span>
                      <div className="sm:text-left">
                        <p className="text-sm font-semibold text-primary">Not in a Nest yet</p>
                        <p className="mt-1 text-xs text-muted">
                          Run a match to begin your 6-week journey.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="md"
                        rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => navigate(ROUTES.DISCOVER)}
                        className="sm:ml-auto"
                      >
                        Discover
                      </Button>
                    </div>
                  )}
                </div>
              </BentoCard>
            </BentoGrid>
          </motion.section>

          {/* ══ Community — Recent Activity + Invitations ══ */}
          <motion.section
            variants={cardStagger}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            <ZoneHeading>Community</ZoneHeading>
            <BentoGrid>
              {/* Recent Activity */}
              <BentoCard className="md:col-span-1 lg:col-span-7">
                <div className="flex h-full flex-col gap-4">
                  <CardTitle icon={Sparkles}>Recent Activity</CardTitle>
                  {compatibles === null || proposals === null || nests === null ? (
                    <div className="flex flex-1 flex-col justify-center gap-3">
                      <Skeleton className="h-12 rounded-xl" />
                      <Skeleton className="h-12 rounded-xl" />
                      <Skeleton className="h-12 rounded-xl" />
                    </div>
                  ) : (
                    <ActivityTimeline events={activity} className="flex-1" />
                  )}
                </div>
              </BentoCard>

              {/* Invitations */}
              <BentoCard className="md:col-span-1 lg:col-span-5">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <CardTitle icon={Inbox}>Invitations</CardTitle>
                    {proposals !== null && proposals.length > 0 && (
                      <span className="glow-dot h-2.5 w-2.5" aria-hidden="true" />
                    )}
                  </div>
                  {proposals === null ? (
                    <CardSkeleton />
                  ) : proposals.length > 0 ? (
                    <button
                      onClick={() => navigate(ROUTES.PROPOSALS)}
                      className="group flex flex-1 flex-col justify-center gap-4 rounded-xl text-left"
                    >
                      <div className="flex items-center gap-3">
                        <MemberAvatarStack members={proposalMembers} max={4} size="md" />
                        <span className="ml-auto rounded-full border border-accent-400/20 bg-accent-400/10 px-2.5 py-1 text-[11px] font-bold text-accent-300">
                          {proposals.length} new
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          {proposals.length} invitation{proposals.length === 1 ? '' : 's'} waiting
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          Tap to review who wants you in their Nest
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent-300 transition-colors group-hover:text-accent-400">
                          View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2">
                        <Inbox className="h-5 w-5 text-muted" aria-hidden="true" />
                      </span>
                      <p className="text-sm text-muted">No pending invitations</p>
                    </div>
                  )}
                </div>
              </BentoCard>
            </BentoGrid>
          </motion.section>

          {/* ══ Overview — Quick Stats + Meetings ══ */}
          <motion.section
            variants={cardStagger}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            <ZoneHeading>Overview</ZoneHeading>
            <BentoGrid>
              {/* Quick Stats */}
              <BentoCard className="md:col-span-1 lg:col-span-6">
                <div className="flex h-full flex-col gap-4">
                  <CardTitle icon={LayoutGrid}>Quick Stats</CardTitle>
                  {nests === null || compatibles === null ? (
                    <div className="grid flex-1 grid-cols-3 gap-4">
                      <Skeleton className="h-24 rounded-xl" />
                      <Skeleton className="h-24 rounded-xl" />
                      <Skeleton className="h-24 rounded-xl" />
                    </div>
                  ) : (
                    <div className="grid flex-1 grid-cols-3 divide-x divide-[var(--color-border)]">
                      <StatCard label="Nests joined" value={nests?.length ?? 0} icon={Home} delay={100} />
                      <StatCard label="Friends made" value={compatibles?.length ?? 0} icon={Users} delay={200} />
                      <StatCard label="Cities explored" value={citiesExplored} icon={MapPin} delay={300} />
                    </div>
                  )}
                </div>
              </BentoCard>

              {/* Meetings — informational; planning happens from the Nest hub */}
              <BentoCard className="md:col-span-1 lg:col-span-6">
                <div className="flex h-full flex-col gap-4">
                  <CardTitle icon={CalendarDays}>Meetings</CardTitle>
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
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2">
                        <CalendarDays className="h-5 w-5 text-accent-400" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          No meetings scheduled yet
                        </p>
                        <p className="mt-1 max-w-xs text-xs text-muted">
                          Once you're in a Nest you can plan your first meetup from the Nest hub.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </BentoCard>
            </BentoGrid>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-4 w-3/4 rounded-lg" />
      <Skeleton className="h-3 w-1/2 rounded-lg" />
    </div>
  );
}
