import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VibeCheckCard } from '@/components/nest/VibeCheckCard';
import { buildDemoNest, buildDemoVibeStatus } from '@/test/demoData';
import type { NestResponse } from '@/types/nest.types';

const openNest = (): NestResponse => ({ ...buildDemoNest(), status: 'VIBE_CHECK' });

describe('VibeCheckCard', () => {
  it('is locked before week 3 (non-VIBE_CHECK nest)', () => {
    render(
      <VibeCheckCard
        nest={buildDemoNest()}
        status={null}
        currentUserId={2}
        isAnchor={false}
        onSubmit={vi.fn()}
        onViewResults={vi.fn()}
      />
    );

    expect(screen.getByText('Vibe Check unlocks in Week 3')).toBeInTheDocument();
    expect(screen.queryByText('Submit Check-in')).not.toBeInTheDocument();
  });

  it('renders the slider form when the check is open and not yet submitted', () => {
    render(
      <VibeCheckCard
        nest={openNest()}
        status={null}
        currentUserId={2}
        isAnchor={false}
        onSubmit={vi.fn()}
        onViewResults={vi.fn()}
      />
    );

    expect(screen.getByText("How's your Nest feeling?")).toBeInTheDocument();
    expect(screen.getByText('Connection Level')).toBeInTheDocument();
    expect(screen.getByText('Comfort Level')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Check-in' })).toBeInTheDocument();
  });

  it('shows a thank-you preview once the user has submitted', () => {
    render(
      <VibeCheckCard
        nest={openNest()}
        status={buildDemoVibeStatus()} // includes userId 2
        currentUserId={2}
        isAnchor={false}
        onSubmit={vi.fn()}
        onViewResults={vi.fn()}
      />
    );

    expect(screen.getByText('Thanks for checking in!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View Results' })).not.toBeInTheDocument();
  });

  it('exposes View Results only to anchors', () => {
    const onViewResults = vi.fn();
    render(
      <VibeCheckCard
        nest={openNest()}
        status={buildDemoVibeStatus()}
        currentUserId={2}
        isAnchor
        onSubmit={vi.fn()}
        onViewResults={onViewResults}
      />
    );

    const viewButton = screen.getByRole('button', { name: 'View Results' });
    fireEvent.click(viewButton);
    expect(onViewResults).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit with the current slider scores', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <VibeCheckCard
        nest={openNest()}
        status={null}
        currentUserId={2}
        isAnchor={false}
        onSubmit={onSubmit}
        onViewResults={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit Check-in' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionScore: expect.any(Number),
        comfortScore: expect.any(Number),
        feedback: undefined,
      })
    );
  });
});
