import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRoute } from '@/router/AppRouter';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import type { User } from '@/types/auth.types';

// The Anchor Reviews page fetches its application list on mount; stub it so
// the admin path renders a clean empty state without any network call.
vi.mock('@/services/userService', () => ({
  userService: {
    listAnchorApplications: vi.fn(),
    reviewAnchorApplication: vi.fn(),
  },
}));

import { userService } from '@/services/userService';
const mockedList = vi.mocked(userService.listAnchorApplications);

function setSession(role: User['role'] | null): void {
  useAuthStore.setState({
    isAuthenticated: true,
    user: role
      ? { id: 1, fullName: 'Krishna', role, isOnboarded: true, email: 'krishna@gmail.com' }
      : null,
  });
}

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.ADMIN_ANCHORS]}>
      <Routes>
        <Route path={ROUTES.ADMIN_ANCHORS} element={<AdminRoute />} />
        <Route path={ROUTES.DASHBOARD} element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminRoute guard', () => {
  beforeEach(() => {
    mockedList.mockReset();
    mockedList.mockResolvedValue([]);
    setSession('ADMIN');
  });

  afterEach(() => {
    setSession(null);
  });

  it('lets an admin view the Anchor Reviews page', async () => {
    renderGuard();

    expect(await screen.findByText('Anchor Reviews')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('bounces newcomers away to the dashboard', async () => {
    setSession('NEWCOMER');
    renderGuard();

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Anchor Reviews')).not.toBeInTheDocument();
  });

  it('bounces anchors away to the dashboard', async () => {
    setSession('ANCHOR');
    renderGuard();

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Anchor Reviews')).not.toBeInTheDocument();
  });

  it('waits with a loader while the profile is still loading (never redirects prematurely)', () => {
    setSession(null);
    renderGuard();

    expect(screen.getByRole('status', { name: 'Loading page' })).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
    expect(screen.queryByText('Anchor Reviews')).not.toBeInTheDocument();
  });
});
