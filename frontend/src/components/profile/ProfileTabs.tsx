import { motion } from 'framer-motion';
import { Settings2, Shapes, UserRound, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The three profile tabs. */
export type ProfileTab = 'info' | 'nests' | 'settings';

/** Tab descriptors with icons. */
const TABS: { id: ProfileTab; label: string; icon: LucideIcon }[] = [
  { id: 'info', label: 'Profile Info', icon: UserRound },
  { id: 'nests', label: 'My Nests', icon: Shapes },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

interface ProfileTabsProps {
  tab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

/**
 * Profile tab bar with a spring-animated emerald underline that slides between
 * the active tab (layoutId shared across renders).
 */
export function ProfileTabs({ tab, onChange }: ProfileTabsProps) {
  return (
    <div role="tablist" className="flex gap-1 rounded-xl border border-slate-700/70 bg-slate-800/50 p-1">
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
              'relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {active && (
              <motion.span
                layoutId="profile-tab-active"
                className="absolute inset-0 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                aria-hidden="true"
              />
            )}
            <Icon className="relative h-4 w-4" aria-hidden="true" />
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
