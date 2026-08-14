import { motion } from 'framer-motion';
import { Settings2, Shapes, UserRound, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProfileTab = 'info' | 'nests' | 'settings';

const TABS: { id: ProfileTab; label: string; icon: LucideIcon }[] = [
  { id: 'info',     label: 'Profile Info', icon: UserRound },
  { id: 'nests',    label: 'My Nests',     icon: Shapes    },
  { id: 'settings', label: 'Settings',     icon: Settings2 },
];

interface ProfileTabsProps {
  tab:      ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

export function ProfileTabs({ tab, onChange }: ProfileTabsProps) {
  return (
    <div
      role="tablist"
      className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-1.5 backdrop-blur-sm shadow-lg shadow-black/10"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = id === tab;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200',
              active
                ? 'bg-[var(--color-surface-2)] text-[var(--accent-400)] shadow-sm'
                : 'text-[var(--text-muted)] hover:bg-[var(--color-raised)]/40 hover:text-[var(--text-primary)]'
            )}
          >
            <Icon className={cn('h-4 w-4 transition-colors', active ? 'text-accent-400' : 'text-muted')} aria-hidden="true" />
            <span>{label}</span>
            {active && (
              <motion.span
                layoutId="profile-tab-indicator"
                className="absolute inset-x-3 -bottom-[5px] h-0.5 rounded-full bg-accent-gradient shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}