import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { FieldError } from '@/components/ui/FieldError';
import { cn } from '@/lib/utils';

interface TagInputProps {
  label: string;
  placeholder?: string;
  hint?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
  maxTags?: number;
}

export function TagInput({
  label,
  placeholder = 'Type and press Enter',
  hint,
  value,
  onChange,
  error,
  maxTags = 12,
}: TagInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/, '');
    if (!tag || value.includes(tag) || value.length >= maxTags) return;
    onChange([...value, tag]);
    setText('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(text);
    } else if (event.key === 'Backspace' && !text && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
          {label}
        </span>
      )}

      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-xl border bg-surface-2 px-4 py-3 transition-all duration-200',
          error
            ? 'border-rose-500/40 shadow-[0_0_0_3px_rgba(244,63,94,0.1)]'
            : 'border-white/[0.08] focus-within:border-accent-400/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]'
        )}
      >
        <AnimatePresence mode="popLayout">
          {value.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent-400/20 bg-accent-400/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-accent-300"
            >
              {tag}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeTag(tag);
                }}
                aria-label={`Remove ${tag}`}
                className="rounded-md p-0.5 text-accent-400 transition-colors hover:bg-accent-400/20 hover:text-accent-200"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <input
          ref={inputRef}
          value={text}
          aria-label={label}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (text.trim()) addTag(text);
          }}
          placeholder={placeholder}
          className="min-w-[140px] flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
        />

        <span className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
          value.length >= maxTags ? 'bg-rose-400/10 text-rose-400' : 'bg-surface text-muted'
        )}>
          {value.length}/{maxTags}
        </span>
      </div>

      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}