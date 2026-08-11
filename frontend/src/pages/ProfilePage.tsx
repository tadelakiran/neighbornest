import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BadgeCheck, Clock3, Home, XCircle } from 'lucide-react';
import { EditProfilePanel } from '@/components/profile/EditProfilePanel';
import { MyNestsPlaceholder } from '@/components/profile/MyNestsPlaceholder';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileInfoTab } from '@/components/profile/ProfileInfoTab';
import { ProfileTabs, type ProfileTab } from '@/components/profile/ProfileTabs';
import { SettingsTab } from '@/components/profile/SettingsTab';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';
import { userService } from '@/services/userService';
import type { AnchorApplicationResponse } from '@/types/user.types';

/** Reads the initial tab from `?tab=` (e.g. the navbar Settings shortcut). */
function initialTab(): ProfileTab {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  return tab === 'settings' ? 'settings' : tab === 'nests' ? 'nests' : 'info';
}

/**
 * Profile dashboard — bento grid: identity hero card on the left, tabbed
 * content on the right (Profile Info / My Nests / Settings), an edit
 * slide-over, and a "Become an Anchor" CTA for newcomers.
 */
export function ProfilePage() {
  const { profile, isLoading, error, reload, updateProfile } = useProfile();
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [editOpen, setEditOpen] = useState(false);
  const [, setSearchParams] = useSearchParams();
  const toast = useToast();

  // Anchor application status — shown instead of the "Become an Anchor" CTA
  // once a newcomer has applied (PENDING / APPROVED / REJECTED).
  const [anchorApp, setAnchorApp] = useState<AnchorApplicationResponse | null>(null);
  const [anchorChecked, setAnchorChecked] = useState(false);

  useEffect(() => {
    const role = profile?.role;
    // Newcomers and Anchors can have an application record; admins skip.
    if (!role || role === 'ADMIN' || anchorChecked) return;
    let active = true;
    userService
      .getAnchorApplication()
      .then((app) => active && setAnchorApp(app))
      .catch(() => active && setAnchorApp(null))
      .finally(() => active && setAnchorChecked(true));
    return () => {
      active = false;
    };
  }, [profile?.role, anchorChecked]);

  const selectTab = (next: ProfileTab) => {
    setTab(next);
    setSearchParams(next === 'info' ? {} : { tab: next }, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-lg lg:col-span-1" />
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-xl border-dashed p-10 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-rose-500/30 bg-rose-500/10">
          <AlertTriangle className="h-6 w-6 text-rose-400" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-bold text-primary">Couldn&apos;t load your profile</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{error}</p>
        <Button variant="secondary" className="mt-6" onClick={() => void reload()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="mx-auto max-w-xl border-dashed p-10 text-center">
        <h1 className="font-display text-xl font-bold text-primary">Finish setting up your profile</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Your profile isn&apos;t ready yet. Complete the short onboarding to
          unlock matching, Nests, and everything else.
        </p>
        <Link to={ROUTES.ONBOARDING}>
          <Button className="mt-6" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
            Complete onboarding
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Anchor application status — takes priority over the "Become an
          Anchor" CTA once an application exists (it stays visible even after
          the role flips to ANCHOR on approval). */}
      {anchorApp ? (
        <AnchorStatusBanner application={anchorApp} />
      ) : profile.role === 'NEWCOMER' ? (
        <Card className="flex flex-col gap-4 border-gold-500/25 bg-gradient-to-r from-gold-600/15 to-transparent p-5 sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gold-400/15">
              <Home className="h-5 w-5 text-gold-300" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">Help others feel at home</p>
              <p className="text-xs text-muted">
                Become a local Anchor and host newcomers in your city.
              </p>
            </div>
            <Link to={ROUTES.ANCHOR_APPLY} className="shrink-0">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
                Become an Anchor
              </Button>
            </Link>
          </Card>
        ) : null}

      {/* Bento grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: hero identity card */}
        <div className="lg:col-span-1">
          <ProfileHeader profile={profile} />
        </div>

        {/* Right: tabs */}
        <div className="lg:col-span-2">
          <ProfileTabs tab={tab} onChange={selectTab} />
          <div className="mt-6">
            {tab === 'info' && <ProfileInfoTab profile={profile} onEdit={() => setEditOpen(true)} />}
            {tab === 'nests' && <MyNestsPlaceholder />}
            {tab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>

      <EditProfilePanel
        profile={profile}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={async (patch) => {
          try {
            await updateProfile(patch);
            toast.success('Profile updated!');
          } catch (error) {
            toast.error(getErrorMessage(error, 'Could not save your profile.'));
            throw error;
          }
        }}
      />
    </div>
  );
}

/**
 * Status banner for a submitted Anchor application — makes the review process
 * visible: an admin reviews the application and approves or rejects it; when
 * approved, the user's role is upgraded to ANCHOR.
 */
function AnchorStatusBanner({ application }: { application: AnchorApplicationResponse }) {
  if (application.status === 'APPROVED') {
    return (
      <Card className="flex flex-col gap-4 border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 to-transparent p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-400/15">
          <BadgeCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">Welcome, Anchor! 🎉</p>
          <p className="text-xs text-muted">
            Your application was approved and your role was upgraded. You can now
            host newcomers and guide your own Nest.
          </p>
        </div>
      </Card>
    );
  }

  if (application.status === 'REJECTED') {
    return (
      <Card className="flex flex-col gap-4 border-rose-500/30 bg-gradient-to-r from-rose-500/15 to-transparent p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-rose-400/15">
          <XCircle className="h-5 w-5 text-rose-400" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">Application not approved</p>
          <p className="text-xs text-muted">
            Our team couldn&apos;t approve this application this time. You can
            re-apply anytime once you&apos;ve built up more local experience.
          </p>
        </div>
        <Link to={ROUTES.ANCHOR_APPLY} className="shrink-0">
          <Button variant="secondary" size="sm">
            Re-apply
          </Button>
        </Link>
      </Card>
    );
  }

  // PENDING
  return (
    <Card className="flex flex-col gap-4 border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-transparent p-5 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-amber-400/15">
        <Clock3 className="h-5 w-5 text-amber-400" aria-hidden="true" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-primary">Application under review</p>
        <p className="text-xs text-muted">
          Our admin team reviews every Anchor application. You&apos;ll see the
          verdict here once they decide — usually within a few days.
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
        Pending review
      </span>
    </Card>
  );
}
