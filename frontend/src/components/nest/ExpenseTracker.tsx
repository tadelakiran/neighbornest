import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, ReceiptText, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExpenseRow } from '@/components/nest/ExpenseRow';
import { cn, formatCurrency } from '@/lib/utils';
import type { ExpenseResponse, NestMemberResponse } from '@/types/nest.types';

interface ExpenseTrackerProps {
  expenses: ExpenseResponse[];
  members: NestMemberResponse[];
  currentUserId: number;
  onAdd: () => void;
  onSettle: (expenseId: number) => Promise<void>;
}

/** Net balance between what I owe and what I'm owed (positive = owed to me). */
function netBalance(expenses: ExpenseResponse[], currentUserId: number): number {
  let owed = 0; // my unsettled shares on other people's expenses
  let owedToMe = 0; // others' unsettled shares on my expenses
  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (split.settled) continue;
      if (split.userId === currentUserId && expense.payerId !== currentUserId) owed += split.amountOwed;
      if (expense.payerId === currentUserId && split.userId !== currentUserId) owedToMe += split.amountOwed;
    }
  }
  return owedToMe - owed;
}

/**
 * Shared-expenses card with a color-coded running balance, monthly grouping
 * with sticky headers, and settle-up actions per row.
 */
export function ExpenseTracker({ expenses, members, currentUserId, onAdd, onSettle }: ExpenseTrackerProps) {
  const net = useMemo(() => netBalance(expenses, currentUserId), [expenses, currentUserId]);

  const groups = useMemo(() => {
    const map = new Map<string, ExpenseResponse[]>();
    [...expenses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((expense) => {
        const label = new Date(expense.createdAt).toLocaleString(undefined, { month: 'long', year: 'numeric' });
        map.set(label, [...(map.get(label) ?? []), expense]);
      });
    return [...map.entries()];
  }, [expenses]);

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-deep/60 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-primary">Shared Expenses</h2>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={onAdd}>
          Add Expense
        </Button>
      </div>

      {/* Running balance */}
      <div
        className={cn(
          'mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold',
          net > 0.005 && 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
          net < -0.005 && 'border-rose-500/25 bg-rose-500/10 text-rose-300',
          net >= -0.005 && net <= 0.005 && 'border-accent-400/25 bg-accent-400/10 text-accent-300'
        )}
      >
        <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
        {net > 0.005 ? `You're owed ${formatCurrency(net)}` : net < -0.005 ? `You owe ${formatCurrency(Math.abs(net))}` : 'All settled!'}
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
            <ReceiptText className="h-7 w-7 text-muted" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">No expenses yet</p>
            <p className="mt-1 text-xs text-muted">Split your first shared purchase with the Nest.</p>
          </div>
        </div>
      ) : (
        <div className="-mx-6 max-h-96 space-y-4 overflow-y-auto px-6">
          {groups.map(([month, list]) => (
            <div key={month}>
              <h3 className="sticky top-0 z-10 -mx-6 border-b border-white/[0.06] bg-deep/95 px-6 py-2 text-xs font-semibold uppercase tracking-widest text-muted backdrop-blur-xl">
                {month}
              </h3>
              <AnimatePresence initial={false}>
                {list.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} currentUserId={currentUserId} members={members} onSettle={onSettle} />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
