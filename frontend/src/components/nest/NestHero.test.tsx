import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NestHero } from '@/components/nest/NestHero';
import { buildDemoNest } from '@/test/demoData';

describe('NestHero', () => {
  beforeEach(() => {
    // Fixed "today" so week/countdown math is deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-10T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the nest name, status and city', () => {
    render(<NestHero nest={buildDemoNest()} />);

    expect(screen.getByRole('heading', { name: 'The Mission Crew' })).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
  });

  it('computes Week 4 of 6 and the days-left countdown from the fixed date', () => {
    render(<NestHero nest={buildDemoNest()} />);

    // startDate 2026-07-20 → Aug 10 is week 4; endDate Aug 31 → 21 days left.
    expect(screen.getByText('Week 4 of 6')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getByText('days left')).toBeInTheDocument();
  });

  it('shows a graduated state instead of a countdown for graduated nests', () => {
    const nest = { ...buildDemoNest(), status: 'GRADUATED' as const, endDate: '2026-08-01' };
    render(<NestHero nest={nest} />);

    expect(screen.getByText('Graduated!')).toBeInTheDocument();
    expect(screen.queryByText('days left')).not.toBeInTheDocument();
  });
});
