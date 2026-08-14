import { useMemo, useState } from 'react';
import { IndianRupee, UserRound, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/hooks/useToast';
import { cn, formatCurrency, getErrorMessage } from '@/lib/utils';
import { createExpense } from '@/services/nestService';
import type { ExpenseResponse, NestMemberResponse, SplitType } from '@/types/nest.types';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  nestId: number | string;
  members: NestMemberResponse[];
  onAdded: (expense: ExpenseResponse) => void;
}

/**
 * Add Expense modal: amount + description, an Equal/Custom split toggle with
 * live previews, a payer picker, and total validation for custom splits.
 */
export function AddExpenseModal({ open, onClose, nestId, members, onAdded }: AddExpenseModalProps) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [custom, setCustom] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const total = Number.parseFloat(amount) || 0;
  const equalShare = members.length > 0 ? total / members.length : 0;
  const customTotal = useMemo(
    () => members.reduce((sum, m) => sum + (Number.parseFloat(custom[m.userId]) || 0), 0),
    [custom, members]
  );
  const customValid = total > 0 && Math.abs(customTotal - total) < 0.01;

  const reset = () => {
    setAmount('');
    setDescription('');
    setSplitType('EQUAL');
    setCustom({});
  };

  const handleSubmit = async () => {
    if (total <= 0 || !description.trim()) {
      toast.error('Enter an amount and a short description.');
      return;
    }
    if (splitType === 'CUSTOM' && !customValid) {
      toast.error(`Custom splits must add up to ${formatCurrency(total)}.`);
      return;
    }
    setSubmitting(true);
    try {
      const expense = await createExpense(nestId, {
        amount: total,
        description: description.trim(),
        splitType,
        splits: splitType === 'CUSTOM'
          ? members
              .map((m) => ({ userId: m.userId, amountOwed: Number.parseFloat(custom[m.userId]) || 0 }))
              .filter((s) => s.amountOwed > 0)
          : [],
      });
      toast.success('Expense added!');
      reset();
      onAdded(expense);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add the expense.'));
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add an Expense" maxWidth="max-w-md">
      <div className="space-y-4">
        <Input
          label="Amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          icon={<IndianRupee className="h-4 w-4" aria-hidden="true" />}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input label="Description" placeholder="e.g. Groceries for the house dinner" value={description} onChange={(e) => setDescription(e.target.value)} />

        {/* Payer — the backend always attributes expenses to the signed-in user */}
        <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-400/10">
            <UserRound className="h-4 w-4 text-accent-300" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary">Paid by you</p>
            <p className="text-[10px] text-muted">Expenses are always attributed to you as the payer.</p>
          </div>
        </div>

        {/* Split type toggle */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Split</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            {(['EQUAL', 'CUSTOM'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSplitType(type)}
                className={cn(
                  'rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200',
                  splitType === type ? 'bg-accent-gradient text-white shadow-glow-sm' : 'text-secondary hover:text-primary'
                )}
              >
                {type === 'EQUAL' ? 'Equal' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Split preview */}
        <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3">
          {splitType === 'EQUAL' ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Avatar name={members.map((m) => m.fullName).join(', ')} size="sm" />
                <span className="text-xs text-secondary">
                  <Users className="mr-1 inline h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                  {members.length} member{members.length === 1 ? '' : 's'}
                </span>
              </div>
              <span className="text-sm font-semibold text-primary">{formatCurrency(equalShare)} each</span>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2.5">
                  <Avatar name={m.fullName} src={m.profilePhotoUrl} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-xs text-secondary">{m.fullName}</span>
                  <Input
                    aria-label={`Amount for ${m.fullName}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="h-8 w-24 rounded-lg px-2 text-right text-xs"
                    value={custom[m.userId] ?? ''}
                    onChange={(e) => setCustom((prev) => ({ ...prev, [m.userId]: e.target.value }))}
                  />
                </div>
              ))}
              <p className={cn('text-xs', customValid ? 'text-emerald-400' : 'text-muted')}>
                Total: {formatCurrency(customTotal)} of {formatCurrency(total)}
              </p>
            </div>
          )}
        </div>

        <Button fullWidth isLoading={submitting} onClick={() => void handleSubmit()} className="shadow-glow">
          {submitting ? 'Adding…' : 'Add Expense'}
        </Button>
      </div>
    </Modal>
  );
}
