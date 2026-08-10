import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseTracker } from '@/components/nest/ExpenseTracker';
import { buildDemoExpenses, buildDemoMembers } from '@/test/demoData';

const MEMBERS = buildDemoMembers();

describe('ExpenseTracker', () => {
  it('shows the correct running balance for the current user', () => {
    // User 2 owes $10 on expense 601, but is owed $12 on expense 600 → net +$2.
    render(
      <ExpenseTracker
        expenses={buildDemoExpenses()}
        members={MEMBERS}
        currentUserId={2}
        onAdd={() => undefined}
        onSettle={vi.fn()}
      />
    );

    expect(screen.getByText("You're owed $2")).toBeInTheDocument();
  });

  it('shows "You owe" when the balance is negative', () => {
    // User 3: owes $10 (601, unsettled), no money owed to them → net -$10.
    render(
      <ExpenseTracker
        expenses={buildDemoExpenses()}
        members={MEMBERS}
        currentUserId={3}
        onAdd={() => undefined}
        onSettle={vi.fn()}
      />
    );

    expect(screen.getByText('You owe $10')).toBeInTheDocument();
  });

  it('groups expenses by month with sticky headers', () => {
    const { container } = render(
      <ExpenseTracker
        expenses={buildDemoExpenses()}
        members={MEMBERS}
        currentUserId={1}
        onAdd={() => undefined}
        onSettle={vi.fn()}
      />
    );

    const headers = container.querySelectorAll('h3');
    expect(headers.length).toBeGreaterThanOrEqual(1);
    expect(headers[0].textContent).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    expect(screen.getByText('Group dinner — Ramen Street')).toBeInTheDocument();
  });

  it('shows a Settle button only for my unsettled share and wires the handler', () => {
    const onSettle = vi.fn().mockResolvedValue(undefined);
    render(
      <ExpenseTracker
        expenses={buildDemoExpenses()}
        members={MEMBERS}
        currentUserId={2}
        onAdd={() => undefined}
        onSettle={onSettle}
      />
    );

    // User 2 owes on expense 601 (payer 1) → settle button present.
    const settleButtons = screen.getAllByRole('button', { name: /Settle/i });
    expect(settleButtons.length).toBe(1);
    fireEvent.click(settleButtons[0]);
    expect(onSettle).toHaveBeenCalledTimes(1);
    expect(onSettle).toHaveBeenCalledWith(601);
  });

  it('shows the empty state when there are no expenses', () => {
    render(
      <ExpenseTracker
        expenses={[]}
        members={MEMBERS}
        currentUserId={1}
        onAdd={() => undefined}
        onSettle={vi.fn()}
      />
    );

    expect(screen.getByText('No expenses yet')).toBeInTheDocument();
    expect(screen.getByText('All settled!')).toBeInTheDocument();
  });
});
