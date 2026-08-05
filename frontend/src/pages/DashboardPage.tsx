import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BellRing, Compass, Home, Pencil, Sparkles, UserRound } from 'lucide-react';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { FeatureGallery } from '@/components/dashboard/FeatureGallery';
import { ReadinessCharts } from '@/components/dashboard/ReadinessCharts';
import { StatCards, computeReadiness } from '@/components/dashboard/StatCards';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LazyImage } from '@/components/ui/LazyImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { IMAGES } from '@/lib/images';
import { ROUTES } from '@/lib/constants';

export function DashboardPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { profile, isLoading } = useProfile();
  const readiness = useMemo(() => computeReadiness(profile), [profile]);
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const quickActions = [
    {
      label:   profile?.isOnboarded ? 'Edit profile' : 'Complete onboarding',
      icon:    profile?.isOnboarded ? Pencil : Sparkles,
      onClick: () => navigate(profile?.isOnboarded ? ROUTES.PROFILE : ROUTES.ONBOARDING),
    },
    { label: 'Become an Anchor', icon: Home,    onClick: () => navigate(ROUTES.ANCHOR_APPLY) },
    { label: 'My Nest',          icon: Compass, onClick: () => navigate(ROUTES.MY_NEST)      },
  ];

  return (
    <div className="space-y-8">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] shadow-card">
        <div className="absolute inset-0">
          <LazyImage
            src={IMAGES.friends}
            alt="Neighbors spending time together in their community"
            aspectRatio="16/7"
            placeholder="blur"
            wrapperClassName="absolute inset-0"
            className="object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-accent-900/92 via-accent-800/65 to-accent-700/20" />
        </div>

        <div className="relative flex flex-col gap-6 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="rounded-full p-0.5 ring-2 ring-white/50 shadow-lg">
              <Avatar name={user?.fullName ?? 'Guest'} src={user?.profilePhotoUrl} size="xl" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Welcome back, {firstName} 👋
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={profile?.isOnboarded ?? user?.isOnboarded ? 'success' : 'warning'}>
                  {profile?.isOnboarded ?? user?.isOnboarded ? 'Onboarded' : 'Onboarding pending'}
                </Badge>
                <Badge variant="info" className="capitalize">
                  {(profile?.role ?? user?.role ?? 'NEWCOMER').toLowerCase()}
                </Badge>
                {profile?.city && <Badge variant="neutral">{profile.city}</Badge>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {quickActions.map(({ label, icon: Icon, onClick }) => (
              <Button
                key={label}
                variant="secondary"
                size="sm"
                leftIcon={<Icon className="h-4 w-4" aria-hidden="true" />}
                onClick={onClick}
                className="border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Onboarding CTA ── */}
      {!profile?.isOnboarded && !isLoading && (
        <Card className="border-accent-200 bg-gradient-to-r from-accent-50 to-white">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-100">
                <Sparkles className="h-5 w-5 text-accent-600" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Finish your onboarding
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {profile
                    ? 'Tell us a bit more so we can match you perfectly.'
                    : 'Set up your profile to unlock matching and Nests.'}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(ROUTES.ONBOARDING)} rightIcon={<ArrowRight className="h-4 w-4" />}>
              {profile ? 'Continue onboarding' : 'Get started'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Stats ── */}
      {isLoading && !profile ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : profile ? (
        <>
          <StatCards profile={profile} readiness={readiness} />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ReadinessCharts profile={profile} readiness={readiness} />
            </div>
            <ActivityTimeline profile={profile} />
          </div>

          {/* Notifications */}
          <Card>
            <div className="mb-4 flex items-center gap-2.5">
              <BellRing className="h-4 w-4 text-accent-500" aria-hidden="true" />
              <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
                Notifications
              </h3>
              <Badge variant="success" className="ml-auto">3 new</Badge>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {[
                { icon: Sparkles,  text: 'Nest matching is coming to your city soon.',                                                 time: 'This week'   },
                { icon: UserRound, text: readiness >= 100 ? "You're ready for matching!" : 'Complete your profile for better matches.', time: 'Tip'         },
                { icon: Home,      text: 'Anchors make every Nest feel like home.',                                                    time: 'Did you know?' },
              ].map(({ icon: Icon, text, time }) => (
                <li key={text} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface)]">
                    <Icon className="h-4 w-4 text-accent-500" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text-primary)]">{text}</p>
                    <p className="text-xs text-[var(--text-muted)]">{time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-gradient shadow-glow">
              <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Your Nest is on the way
            </h2>
            <p className="max-w-md text-sm text-[var(--text-muted)]">
              Complete your profile and onboarding so we can match you with compatible neighbors.
            </p>
            <Button onClick={() => navigate(ROUTES.ONBOARDING)} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Complete onboarding
            </Button>
          </div>
        </Card>
      )}

      <FeatureGallery />
    </div>
  );
}
