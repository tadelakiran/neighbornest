import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  Compass,
  Home,
  Pencil,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { FeatureGallery } from '@/components/dashboard/FeatureGallery';
import { ReadinessCharts } from '@/components/dashboard/ReadinessCharts';
import { StatCards, computeReadiness } from '@/components/dashboard/StatCards';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { IMAGES } from '@/lib/images';
import { ROUTES } from '@/lib/constants';

/**
 * Dashboard — the post-login landing surface.
 *
 * Renders a photo hero + welcome header, real stat cards, dependency-free SVG
 * charts (readiness donut + values bars), an activity timeline, a notification
 * preview, quick actions, and a photography gallery previewing future modules.
 * All profile data comes through the 30s-cached profile endpoint, so the page
 * paints instantly and shows shimmering skeletons only while it loads.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading } = useProfile();
  const readiness = useMemo(() => computeReadiness(profile), [profile]);
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const quickActions = [
    {
      label: profile?.isOnboarded ? 'Edit profile' : 'Complete onboarding',
      icon: profile?.isOnboarded ? Pencil : Sparkles,
      onClick: () => navigate(profile?.isOnboarded ? ROUTES.PROFILE : ROUTES.ONBOARDING),
    },
    {
      label: 'Become an Anchor',
      icon: Home,
      onClick: () => navigate(ROUTES.ANCHOR_APPLY),
    },
    {
      label: 'My Nest',
      icon: Compass,
      onClick: () => navigate(ROUTES.MY_NEST),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Photo hero + welcome */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800">
        <img
          src={IMAGES.friends}
          alt="Neighbors spending time together in their community"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/20" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={user?.fullName ?? 'Guest'} src={user?.profilePhotoUrl} size="lg" className="h-16 w-16 text-2xl ring-2 ring-emerald-500/40" />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
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

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-3">
            {quickActions.map(({ label, icon: Icon, onClick }) => (
              <Button key={label} variant="secondary" size="sm" leftIcon={<Icon className="h-4 w-4" aria-hidden="true" />} onClick={onClick}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Onboarding CTA when the profile is still pending */}
      {!profile?.isOnboarded && !isLoading && (
        <Card className="border-emerald-500/25 bg-gradient-to-r from-emerald-950/60 to-slate-800/60">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                <Sparkles className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">Finish your onboarding</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {profile ? 'Tell us a bit more so we can match you perfectly.' : 'Set up your profile to unlock matching and Nests.'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(ROUTES.ONBOARDING)}
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              {profile ? 'Continue onboarding' : 'Get started'}
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      {isLoading && !profile ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : profile ? (
        <>
          <StatCards profile={profile} readiness={readiness} />

          {/* Charts + timeline */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ReadinessCharts profile={profile} readiness={readiness} />
            </div>
            <ActivityTimeline profile={profile} />
          </div>

          {/* Notifications preview */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <BellRing className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Notifications</h3>
              <Badge variant="success" className="ml-auto">3 new</Badge>
            </div>
            <ul className="divide-y divide-slate-800">
              {[
                { icon: Sparkles, text: 'Nest matching is coming to your city soon.', time: 'This week' },
                { icon: UserRound, text: readiness >= 100 ? 'You’re ready for matching!' : 'Complete your profile for better matches.', time: 'Tip' },
                { icon: Home, text: 'Anchors make every Nest feel like home.', time: 'Did you know?' },
              ].map(({ icon: Icon, text, time }) => (
                <li key={text} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                    <Icon className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">{text}</p>
                    <p className="text-xs text-slate-500">{time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <Card className="border-dashed">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Sparkles className="h-6 w-6 text-emerald-950" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold text-white">Your Nest is on the way</h2>
            <p className="max-w-md text-sm text-slate-400">
              Complete your profile and onboarding so we can match you with compatible neighbors.
            </p>
            <Button onClick={() => navigate(ROUTES.ONBOARDING)} rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
              Complete onboarding
            </Button>
          </div>
        </Card>
      )}

      {/* Upcoming modules */}
      <FeatureGallery />
    </div>
  );
}
