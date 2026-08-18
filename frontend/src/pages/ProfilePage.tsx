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
import type { AnchorApplication } from '@/types/user.types';

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
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // backend limit: 5 MB
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ProfilePage() {
  const { profile, isLoading, error, reload, updateProfile, uploadPhoto } = useProfile();
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [editOpen, setEditOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [, setSearchParams] = useSearchParams();
  const toast = useToast();

  /** Uploads a chosen photo, with client-side validation matching the backend. */
  const handleUploadPhoto = async (file: File) => {
    if (!PHOTO_TYPES.includes(file.type)) {
      toast.error('Please choose a JPG, PNG, WEBP, or GIF image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Photo is too large — the maximum size is 5 MB.');
      return;
    }
    setPhotoUploading(true);
    try {
      await uploadPhoto(file);
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not upload your photo. Please try again.'));
    } finally {
      setPhotoUploading(false);
    }
  };

  const [anchorApp, setAnchorApp] = useState<AnchorApplication | null>(null);
  const [anchorChecked, setAnchorChecked] = useState(false);

  useEffect(() => {
    const role = profile?.role;
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
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-[var(--error)]/30 bg-[var(--error)]/10">
          <AlertTriangle className="h-6 w-6 text-[var(--error)]" aria-hidden="true" />
        </span>
        <h1 className="font-['Space_Grotesk'] text-xl font-bold text-[var(--text-primary)]">
          Couldn&apos;t load your profile
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
          {error}
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => void reload()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="mx-auto max-w-xl border-dashed p-10 text-center">
        <h1 className="font-['Space_Grotesk'] text-xl font-bold text-[var(--text-primary)]">
          Finish setting up your profile
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
          Your profile isn&apos;t ready yet. Complete the short onboarding to unlock matching,
          Nests, and everything else.
        </p>
        <Link to={ROUTES.ONBOARDING}>
          <Button
            className="mt-6"
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          >
            Complete onboarding
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {anchorApp ? (
        <AnchorStatusBanner application={anchorApp} />
      ) : profile.role === 'NEWCOMER' ? (
        <Card className="flex flex-col gap-4 border-[var(--royal-500)]/25 bg-gradient-to-r from-[var(--royal-500)]/15 to-transparent p-5 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--royal-400)]/15">
            <Home className="h-5 w-5 text-[var(--royal-300)]" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Help others feel at home
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Become a local Anchor and host newcomers in your city.
            </p>
          </div>
          <Link to={ROUTES.ANCHOR_APPLY} className="shrink-0">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Become an Anchor
            </Button>
          </Link>
        </Card>
      ) : null}

      {/* Bento grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProfileHeader profile={profile} onUploadPhoto={handleUploadPhoto} uploading={photoUploading} />
        </div>

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

function AnchorStatusBanner({ application }: { application: AnchorApplication }) {
  if (application.status === 'APPROVED') {
    return (
      <Card className="flex flex-col gap-4 border-[var(--success)]/30 bg-gradient-to-r from-[var(--success)]/15 to-transparent p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--success)]/15">
          <BadgeCheck className="h-5 w-5 text-[var(--success)]" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Welcome, Anchor! 🎉</p>
          <p className="text-xs text-[var(--text-muted)]">
            Your application was approved and your role was upgraded. You can now host newcomers and
            guide your own Nest.
          </p>
        </div>
      </Card>
    );
  }

  if (application.status === 'REJECTED') {
    return (
      <Card className="flex flex-col gap-4 border-[var(--error)]/30 bg-gradient-to-r from-[var(--error)]/15 to-transparent p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--error)]/15">
          <XCircle className="h-5 w-5 text-[var(--error)]" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Application not approved
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Our team couldn&apos;t approve this application this time. You can re-apply anytime once
            you&apos;ve built up more local experience.
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
    <Card className="flex flex-col gap-4 border-[var(--warning)]/30 bg-gradient-to-r from-[var(--warning)]/15 to-transparent p-5 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--warning)]/15">
        <Clock3 className="h-5 w-5 text-[var(--warning)]" aria-hidden="true" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Application under review</p>
        <p className="text-xs text-[var(--text-muted)]">
          Our admin team reviews every Anchor application. You&apos;ll see the verdict here once
          they decide — usually within a few days.
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3 py-1 text-xs font-medium text-[var(--warning)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--warning)]" aria-hidden="true" />
        Pending review
      </span>
    </Card>
  );
}