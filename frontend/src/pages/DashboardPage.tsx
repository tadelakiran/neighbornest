import { Building2, MessageSquare, Sparkles, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

/** Placeholder stat cards for future modules. */
const STATS = [
  { icon: Users, label: 'Nest members', value: '—', hint: 'Module 3' },
  { icon: MessageSquare, label: 'Unread messages', value: '—', hint: 'Module 4' },
  { icon: Building2, label: 'City events', value: '—', hint: 'Module 5' },
];

/**
 * Dashboard — placeholder surface for Module 3 (Nests & matching).
 * Greets the user and previews upcoming modules.
 */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user?.fullName ?? 'Guest'} src={user?.profilePhotoUrl} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.fullName?.split(' ')[0] ?? 'there'} 👋
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={user?.isOnboarded ? 'success' : 'warning'}>
                {user?.isOnboarded ? 'Onboarded' : 'Onboarding pending'}
              </Badge>
              <Badge variant="info" className="capitalize">
                {user?.role.toLowerCase() ?? 'Newcomer'}
              </Badge>
              {user?.city && <Badge variant="neutral">{user.city}</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map(({ icon: Icon, label, value, hint }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
              <Icon className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-400">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{hint}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Module 3 teaser */}
      <Card className="border-dashed">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25">
            <Sparkles className="h-6 w-6 text-emerald-950" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Your Nest is on the way</h2>
            <p className="mt-1 text-sm text-slate-400">
              Module 3 brings Nests, matching, and proposals. Once your profile and onboarding are
              complete, we&apos;ll match you with compatible neighbors.
            </p>
          </div>
          <Badge variant="info">Coming soon</Badge>
        </div>
      </Card>
    </div>
  );
}
