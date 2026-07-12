// @vitest-environment jsdom
// AdminPage — the /admin console guard + user list. We mock the admin api
// module (per plan) and the `useIsAdmin` gate so the two behaviours under test
// are isolated: a non-admin is bounced to root, an admin sees the list. Heavy
// boundaries (Screen, the drawers, drawer-store, the router graph, own scss)
// are stubbed so the render stays about AdminPage's own logic.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';

const h = vi.hoisted(() => ({ isAdmin: true as boolean | null }));

vi.mock('@/features/admin/useIsAdmin', () => ({
  useAdminGate: () => ({ isAdmin: h.isAdmin, retry: vi.fn() }),
}));
vi.mock('@/shared/lib/api/admin', () => ({ fetchAdminUsers: vi.fn() }));
// RouterLinks only — importing the real module would pull the whole page graph
// + createBrowserRouter side effects into the test.
vi.mock('@/app/router', () => ({ RouterLinks: { Root: '/', Admin: '/admin' } }));
vi.mock('@/shared/ui/drawer-store', () => ({ drawerStore: { show: vi.fn() } }));
vi.mock('@/features/admin/TopupDrawer', () => ({ TopupDrawer: () => null }));
vi.mock('@/features/admin/UserLedgerDrawer', () => ({ UserLedgerDrawer: () => null }));
vi.mock('@/shared/ui/Screen', () => ({
  Screen: ({ header, children }: { header?: ReactNode; children?: ReactNode }) => (
    <div>
      {header}
      {children}
    </div>
  ),
}));
vi.mock('./AdminPage.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `admin-${String(p)}` }),
}));

import { fetchAdminUsers, type AdminUser } from '@/shared/lib/api/admin';
import { AdminPage } from './AdminPage';

const mockUsers = vi.mocked(fetchAdminUsers);

const user = (over: Partial<AdminUser>): AdminUser => ({
  id: 'u1',
  email: 'alice@example.com',
  role: 'user',
  createdAt: '2026-06-01T00:00:00.000Z',
  balanceKop: 12300,
  hasWallet: true,
  ...over,
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<div>ROOT</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockUsers.mockReset();
  h.isAdmin = true;
});

describe('AdminPage', () => {
  it('non-admin is redirected to root (does not fetch the list)', () => {
    h.isAdmin = false;
    renderPage();
    expect(screen.getByText('ROOT')).toBeInTheDocument();
    expect(mockUsers).not.toHaveBeenCalled();
  });

  it('shows a loader + retry (not a blank page) while the verdict is undecided (null)', () => {
    h.isAdmin = null;
    renderPage();
    // Not bounced, not fetching — but NOT a dead blank page either: a real admin
    // caught by a transient probe failure gets a way out.
    expect(screen.queryByText('ROOT')).not.toBeInTheDocument();
    expect(mockUsers).not.toHaveBeenCalled();
    expect(screen.getByText('Проверяем доступ…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument();
  });

  it('admin sees the user list with email, role and ₽ balance', async () => {
    mockUsers.mockResolvedValue([
      user({ id: 'u1', email: 'alice@example.com', role: 'admin', balanceKop: 12300 }),
      user({ id: 'u2', email: 'bob@example.com', role: 'user', balanceKop: 5000 }),
    ]);
    renderPage();

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    // 12300 kop → "123 ₽", 5000 kop → "50 ₽"
    expect(screen.getByText('123 ₽')).toBeInTheDocument();
    expect(screen.getByText('50 ₽')).toBeInTheDocument();
  });
});
