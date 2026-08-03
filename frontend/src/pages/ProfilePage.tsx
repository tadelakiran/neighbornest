import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Home } from 'lucide-react';
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

/** Reads the initial tab from `?tab=` (e.g. the navbar Settings shortcut). */
function initialTab(): ProfileTab {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  return tab === 'settings' ? 'settings' : tab === 'nests' ? 'nests' : 'info';
}

/**
 * Profile dashboard — sticky identity card on the left, tabbed content on the
 * right (Profile Info / My Nests / Settings), an edit slide-over, and a
 * "Become an Anchor" CTA for newcomers.
 */
export function ProfilePage() {
  const { profile, isLoading, error, reload, updateProfile } = useProfile();
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [editOpen, setEditOpen] = useState(false);
  const [, setSearchParams] = useSearchParams();
  const toast = useToast();

  const selectTab = (next: ProfileTab) => {
    setTab(next);
    setSearchParams(next === 'info' ? {} : { tab: next }, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton of the Become-an-Anchor CTA */}
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-1" />
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-xl border-dashed p-10 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10">
          <AlertTriangle className="h-6 w-6 text-rose-400" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-white">Couldn&apos;t load your profile</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">{error}</p>
        <Button variant="secondary" className="mt-6" onClick={() => void reload()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="mx-auto max-w-xl border-dashed p-10 text-center">
        <h1 className="text-xl font-bold text-white">Finish setting up your profile</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
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
      {/* Become-an-Anchor CTA (newcomers only) */}
      {profile.role === 'NEWCOMER' && (
        <Card className="flex flex-col gap-4 border-emerald-500/25 bg-gradient-to-r from-emerald-950/70 to-slate-800/70 p-5 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <Home className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Help others feel at home</p>
            <p className="text-xs text-slate-400">
              Become a local Anchor and host newcomers in your city.
            </p>
          </div>
          <Link to={ROUTES.ANCHOR_APPLY} className="shrink-0">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
              Become an Anchor
            </Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: sticky identity card */}
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
