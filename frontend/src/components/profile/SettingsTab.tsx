import { useState } from 'react';
import { BellRing, KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/hooks/useToast';
import { NOTIFICATION_PREFS_KEY } from '@/lib/constants';

/** Notification preference keys + defaults. */
const DEFAULT_PREFS = { nestUpdates: true, newMatches: true, messages: false };
type PrefKey = keyof typeof DEFAULT_PREFS;

/** Loads saved preferences (falls back to defaults). */
function loadPrefs(): Record<PrefKey, boolean> {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Record<PrefKey, boolean>) };
  } catch {
    // ignore corrupt prefs
  }
  return { ...DEFAULT_PREFS };
}

const PREF_LABELS: { key: PrefKey; label: string; description: string }[] = [
  { key: 'nestUpdates', label: 'Nest updates', description: 'New members and activity in your Nest' },
  { key: 'newMatches', label: 'New matches', description: 'When we find a compatible neighbor' },
  { key: 'messages', label: 'Messages', description: 'Direct messages from Nest members' },
];

/**
 * Settings tab — notification toggles (localStorage-persisted), a change
 * password form, and a delete-account danger zone with a confirm modal.
 */
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
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2.5">
          <BellRing className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Notifications</h4>
        </div>
        <div className="mt-1 divide-y divide-slate-700/60">
          {PREF_LABELS.map(({ key, label, description }) => (
            <Toggle
              key={key}
              label={label}
              description={description}
              checked={prefs[key]}
              onChange={(checked) => togglePref(key, checked)}
            />
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <KeyRound className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Change password</h4>
        </div>
        <div className="space-y-4">
          <Input id="st-current" type="password" label="Current password" placeholder="••••••••" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="st-new" type="password" label="New password" placeholder="••••••••" />
            <Input id="st-confirm" type="password" label="Confirm new password" placeholder="••••••••" />
          </div>
          <Button
            onClick={() => toast.info('Changing your password is coming in a future module.')}
            className="self-start"
          >
            Update password
          </Button>
        </div>
      </Card>

      <Card className="border-rose-500/40 p-5">
        <div className="mb-2 flex items-center gap-2.5">
          <Trash2 className="h-4 w-4 text-rose-400" aria-hidden="true" />
          <h4 className="text-sm font-semibold uppercase tracking-wide text-rose-300">Danger zone</h4>
        </div>
        <p className="text-sm text-slate-400">
          Deleting your account removes your profile and data permanently. This
          action cannot be undone.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setDeleteOpen(true)}>
          Delete account
        </Button>
      </Card>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        maxWidth="max-w-sm"
      >
        <p className="text-sm leading-relaxed text-slate-400">
          This will permanently delete your profile, onboarding answers, and any
          Nest memberships. Are you sure?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setDeleteOpen(false);
              toast.info('Account deletion is not available yet — coming in a future module.');
            }}
          >
            Yes, delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
