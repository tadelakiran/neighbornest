import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ConfettiBurst } from '@/components/matching/ConfettiBurst';
import { cn, formatCurrency } from '@/lib/utils';
import type { ExpenseResponse, NestMemberResponse } from '@/types/nest.types';

interface ExpenseRowProps {
  expense: ExpenseResponse;
  currentUserId: number;
  members: NestMemberResponse[];
  /** Settles the current user's share; resolves once the server confirms. */
  onSettle: (expenseId: number) => Promise<void>;
}

/**
 * A single expense row. Shows the payer, amount and your share with a Settle
 * button that morphs into a checkmark, fires a small confetti burst, and
 * flashes the row emerald when the settlement succeeds.
 */
export function ExpenseRow({ expense, currentUserId, members, onSettle }: ExpenseRowProps) {
  const payer = members.find((m) => m.userId === expense.payerId);
  const mySplit = expense.splits.find((s) => s.userId === currentUserId);
  const isPayer = expense.payerId === currentUserId;

  const [settling, setSettling] = useState(false);
  const [burst, setBurst] = useState(false);
  const settled = mySplit?.settled ?? false;

  const handleSettle = async () => {
    if (settling) return;
    setSettling(true);
    try {
      await onSettle(expense.id);
      setBurst(true);
      window.setTimeout(() => setBurst(false), 1800);
    } finally {
      setSettling(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-xl px-3 py-3 transition-colors hover:bg-[var(--color-raised)]/40"
    >
      {/* Settle flash */}
      <AnimatePresence>
        {burst && (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 bg-emerald-500/10"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      {burst && <ConfettiBurst count={6} />}

      <div className="relative flex items-center gap-3">
        <Avatar name={payer?.fullName ?? 'Someone'} src={payer?.profilePhotoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-primary">{expense.description}</p>
          <p className="mt-0.5 text-xs text-muted">
            {isPayer ? 'You paid' : `${payer?.fullName ?? 'Someone'} paid`}
            {expense.splitType === 'EQUAL' ? ' · split equally' : ' · custom split'}
          </p>
        </div>
        <p className="shrink-0 text-lg font-bold tabular-nums text-primary">{formatCurrency(expense.amount)}</p>
      </div>

      {/* Your share + settle */}
      <div className="relative mt-2 flex items-center justify-between pl-11">
        {isPayer && !mySplit ? (
          <span className="text-xs font-medium text-emerald-400">Paid by you — all set</span>
        ) : mySplit ? (
          settled ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Paid
            </span>
          ) : isPayer ? (
            <span className="text-xs text-secondary">You paid — settle your share to balance the books</span>
          ) : (
            <span className="text-xs font-semibold text-rose-400">You owe {formatCurrency(mySplit.amountOwed)}</span>
          )
        ) : (
          <span className="text-xs text-muted">Not in this split</span>
        )}

        {mySplit && !settled && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.button
              key={settling ? 'spinner' : 'settle'}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => void handleSettle()}
              disabled={settling}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300',
                'bg-accent-500/15 text-accent-300 hover:bg-accent-500/25 hover:text-accent-200',
                'disabled:cursor-wait disabled:opacity-70'
              )}
            >
              {settling ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : 'Settle'}
            </motion.button>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
