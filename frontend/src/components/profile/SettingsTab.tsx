import { useState } from 'react';
import { BellRing, KeyRound, Trash2, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/hooks/useToast';
import { NOTIFICATION_PREFS_KEY } from '@/lib/constants';


const DEFAULT_PREFS = { nestUpdates: true, newMatches: true, messages: false };
type PrefKey = keyof typeof DEFAULT_PREFS;

function loadPrefs(): Record<PrefKey, boolean> {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Record<PrefKey, boolean>) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_PREFS };
}

const PREF_LABELS: { key: PrefKey; label: string; description: string }[] = [
  { key: 'nestUpdates', label: 'Nest updates', description: 'New members and activity in your Nest' },
  { key: 'newMatches', label: 'New matches', description: 'When we find a compatible neighbor' },
  { key: 'messages', label: 'Messages', description: 'Direct messages from Nest members' },
];

export function SettingsTab() {
  const toast = useToast();
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(loadPrefs);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const togglePref = (key: PrefKey, checked: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: checked };
      window.localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Notifications */}
      <Card className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5 backdrop-blur-sm shadow-lg shadow-black/5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/10 ring-1 ring-accent-400/20">
            <BellRing className="h-4 w-4 text-accent-400" aria-hidden="true" />
          </span>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Notifications</h4>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {PREF_LABELS.map(({ key, label, description }) => (
            <div key={key} className="py-3 first:pt-0 last:pb-0">
              <Toggle
                label={label}
                description={description}
                checked={prefs[key]}
                onChange={(checked) => togglePref(key, checked)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Password */}
      <Card className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5 backdrop-blur-sm shadow-lg shadow-black/5">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/10 ring-1 ring-accent-400/20">
            <KeyRound className="h-4 w-4 text-accent-400" aria-hidden="true" />
          </span>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Change password</h4>
        </div>
        <div className="space-y-4">
          <Input
            id="st-current"
            type="password"
            label="Current password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4 text-muted" aria-hidden="true" />}
            className="h-12 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] transition-all focus-within:border-[var(--accent-400)]/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="st-new"
              type="password"
              label="New password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4 text-muted" aria-hidden="true" />}
              className="h-12 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] transition-all focus-within:border-[var(--accent-400)]/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
            />
            <Input
              id="st-confirm"
              type="password"
              label="Confirm new password"
              placeholder="••••••••"
              icon={<Eye className="h-4 w-4 text-muted" aria-hidden="true" />}
              className="h-12 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] transition-all focus-within:border-[var(--accent-400)]/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
            />
          </div>
          <Button
            onClick={() => toast.info('Changing your password is coming in a future module.')}
            className="rounded-xl shadow-glow-sm"
          >
            Update password
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-400/10 ring-1 ring-rose-400/20">
            <Trash2 className="h-4 w-4 text-rose-400" aria-hidden="true" />
          </span>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-rose-300">Danger zone</h4>
            <p className="mt-0.5 text-xs text-rose-300/70">Destructive actions</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Deleting your account removes your profile and data permanently. This action cannot be undone.
        </p>
        <Button
          variant="danger"
          className="mt-4 rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
          onClick={() => setDeleteOpen(true)}
        >
          Delete account
        </Button>
      </Card>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-400/10 ring-1 ring-rose-400/20">
            <Trash2 className="h-7 w-7 text-rose-400" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Are you absolutely sure?</p>
            <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-muted">
              This will permanently delete your profile, onboarding answers, and any Nest memberships.
            </p>
          </div>
          <div className="flex w-full gap-3">
            <Button variant="ghost" fullWidth onClick={() => setDeleteOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              className="rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
              onClick={() => {
                setDeleteOpen(false);
                toast.info('Account deletion is not available yet — coming in a future module.');
              }}
            >
              Yes, delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}