import type { ReactNode } from 'react';
import { Mail, MapPin, Pencil } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/**
 * Profile — placeholder surface for Module 2 (profile & onboarding).
 * Shows the current user summary; editing arrives with the profile module.
 */
export function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}
          onClick={() => toast.info('Profile editing arrives in Module 2.')}
        >
          Edit profile
        </Button>
      </div>

      {/* Identity card */}
      <Card className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <Avatar name={user?.fullName ?? 'Guest'} src={user?.profilePhotoUrl} size="lg" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{user?.fullName ?? 'Guest'}</h2>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge variant={user?.isOnboarded ? 'success' : 'warning'}>
              {user?.isOnboarded ? 'Onboarded' : 'Onboarding pending'}
            </Badge>
            <Badge variant="info" className="capitalize">
              {user?.role.toLowerCase() ?? 'Newcomer'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card className="divide-y divide-slate-700/60 p-0">
        <DetailRow icon={<Mail className="h-4 w-4 text-slate-400" />} label="Email" value={user?.email ?? 'Not available'} />
        <DetailRow icon={<MapPin className="h-4 w-4 text-slate-400" />} label="City" value={user?.city ?? 'Not set'} />
      </Card>

      <Card className="border-dashed text-center">
        <p className="text-sm text-slate-400">
          Onboarding answers, lifestyle preferences, and compatibility data arrive with{' '}
          <span className="font-semibold text-emerald-400">Module 2</span>.
        </p>
      </Card>
    </div>
  );
}

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: string;
}

/** Label/value row used inside the details card. */
function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-sm font-medium text-slate-100">{value}</p>
      </div>
    </div>
  );
}
