import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth.types';

function setSession(role: User['role'] | null): void {
  useAuthStore.setState({
    isAuthenticated: true,
    user: role
      ? { id: 1, fullName: 'Krishna', role, isOnboarded: true, email: 'krishna@gmail.com' }
      : null,
  });
}

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar isOpen onClose={() => undefined} />
    </MemoryRouter>
  );
}

describe('Sidebar admin section', () => {
  beforeEach(() => setSession('NEWCOMER'));
  afterEach(() => setSession(null));

  it('hides the Anchor Reviews link from newcomers', () => {
    renderSidebar();
    expect(screen.queryByText('Anchor Reviews')).not.toBeInTheDocument();
  });

  it('hides the Anchor Reviews link from anchors', () => {
    setSession('ANCHOR');
    renderSidebar();
    expect(screen.queryByText('Anchor Reviews')).not.toBeInTheDocument();
  });

  it('shows the Anchor Reviews link to admins only', () => {
    setSession('ADMIN');
    renderSidebar();
    expect(screen.getByText('Anchor Reviews')).toBeInTheDocument();
  });
});