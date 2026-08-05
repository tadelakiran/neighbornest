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

/**
 * Custom tag input: type a value and press Enter (or comma) to add a removable
 * pill; Backspace on an empty input removes the last tag. Pills animate in and
 * out with a scale + fade.
 */
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
      {label && <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">{label}</span>}

      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-surface px-3 py-2.5 transition-colors duration-200',
          error
            ? 'border-rose-500/50'
            : 'focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-400/20'
        )}
      >
        <AnimatePresence>
          {value.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              className="inline-flex items-center gap-1 rounded-full bg-accent-400/15 py-1 pl-2.5 pr-1 text-xs font-medium text-accent-200"
            >
              {tag}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeTag(tag);
                }}
                aria-label={`Remove ${tag}`}
                className="rounded-full p-0.5 text-accent-300 transition-colors hover:bg-accent-400/20 hover:text-accent-100"
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

        <span className="shrink-0 text-xs text-muted">
          {value.length}/{maxTags}
        </span>
      </div>

      {hint && !error && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}
