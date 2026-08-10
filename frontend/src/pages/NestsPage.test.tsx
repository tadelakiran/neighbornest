import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NestsPage } from '@/pages/NestsPage';
import { buildDemoNest } from '@/test/demoData';

vi.mock('@/services/nestService', () => ({
  getMyNests: vi.fn(),
}));

import { getMyNests } from '@/services/nestService';
const mockedGetMyNests = vi.mocked(getMyNests);

function renderPage() {
  return render(
    <MemoryRouter>
      <NestsPage />
    </MemoryRouter>
  );
}

describe('NestsPage', () => {
  beforeEach(() => {
    mockedGetMyNests.mockReset();
  });

  it('groups nests into Active and Graduated sections', async () => {
    const active = buildDemoNest();
    const graduated = { ...buildDemoNest(), id: 102, name: 'Old Harbor Pals', status: 'GRADUATED' as const, endDate: '2026-07-01' };
    mockedGetMyNests.mockResolvedValue([active, graduated]);

    renderPage();

    expect(await screen.findByText('The Mission Crew')).toBeInTheDocument();
    expect(screen.getByText('Old Harbor Pals')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Graduated')).toBeInTheDocument();
  });

  it('shows the empty state when the user has no nests', async () => {
    mockedGetMyNests.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('You have no active Nest')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Discover/ })).toBeInTheDocument();
  });

  it('degrades gracefully when the API call fails', async () => {
    mockedGetMyNests.mockRejectedValue(new Error('boom'));

    renderPage();

    expect(await screen.findByText('You have no active Nest')).toBeInTheDocument();
  });
});
