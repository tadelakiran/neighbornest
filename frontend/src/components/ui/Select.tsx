import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A single dropdown option. */
export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Custom dropdown (not a native `<select>`): styled trigger with an animated
 * chevron, a smooth open/close listbox, emerald highlight on the selected item,
 * and click-outside / Escape dismissal.
 */
export function Select({
  label,
  placeholder = 'Select…',
  value,
  onChange,
  options,
  error,
  id,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  // Close on outside click or Escape while open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={rootRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      )}

      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 text-sm outline-none transition-colors duration-200',
          'disabled:cursor-not-allowed disabled:opacity-60',
          open ? 'border-emerald-500 ring-2 ring-emerald-500/25' : 'hover:border-slate-600',
          error && 'border-rose-500/70'
        )}
      >
        <span className={cn('truncate', selected ? 'text-slate-100' : 'text-slate-500')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-800 p-1 shadow-xl shadow-black/40"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'text-slate-300 hover:bg-slate-700/70'
                    )}
                  >
                    {option.label}
                    {isSelected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
