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

/**
 * Profile tab bar — spring-animated sliding underline indicator.
 * White/light bg in light mode, dark surface in dark mode.
 */
export function ProfileTabs({ tab, onChange }: ProfileTabsProps) {
  return (
    <div
      role="tablist"
      className="flex gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
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
              'relative flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200',
              active
                ? 'bg-[var(--color-bg)] text-accent-600 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
            {active && (
              <motion.span
                layoutId="profile-tab-indicator"
                className="absolute inset-x-3 -bottom-[5px] h-0.5 rounded-full bg-accent-gradient"
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
