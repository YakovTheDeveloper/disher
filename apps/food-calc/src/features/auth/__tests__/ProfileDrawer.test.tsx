// ProfileDrawer — account drawer, VariantD root: flat setting rows (no accordions,
// no plaques). The heavy children (DrawerLayout, pickers, BalanceSection, sync
// chip) and the modal store are stubbed so the test isolates the drawer's own
// logic: rows visible at rest, sign-out gated behind the typed-confirm modal.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

const mockAuth = { email: 'user@example.com', signOut: vi.fn() };
vi.mock('../auth-store', () => ({
  useAuthStore: (selector: (s: typeof mockAuth) => unknown) => selector(mockAuth),
}));

// The «Админка» entry pulls in useNavigate + useIsAdmin + RouterLinks. Stub them
// so this test stays isolated (no Router provider, no probe): the admin row is
// hidden (useIsAdmin → false), leaving the rows under test unchanged.
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/app/router', () => ({ RouterLinks: { Root: '/', Admin: '/admin' } }));
vi.mock('@/features/admin/useIsAdmin', () => ({ useIsAdmin: () => false }));

const mockSyncPref = { syncEnabled: true, setSyncEnabled: vi.fn() };
vi.mock('@/shared/lib/sync-pref', () => ({
  useSyncPrefStore: (selector: (s: typeof mockSyncPref) => unknown) => selector(mockSyncPref),
}));

const mockColorMode = { mode: 'light' as 'light' | 'dark', setMode: vi.fn() };
vi.mock('@/shared/lib/color-mode', () => ({
  useColorModeStore: (selector: (s: typeof mockColorMode) => unknown) => selector(mockColorMode),
}));

vi.mock('@/shared/lib/snapshot', () => ({
  dump: vi.fn(),
  apply: vi.fn(),
  deleteBackup: vi.fn(),
}));

vi.mock('@/shared/lib/sync/runSync', () => ({ runSyncTracked: vi.fn() }));

const mockShow = vi.fn();
vi.mock('@/shared/ui/modal-store', () => ({ modalStore: { show: (...a: unknown[]) => mockShow(...a) } }));
vi.mock('@/shared/ui/drawer-store', () => ({ drawerStore: { show: vi.fn() } }));

vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ children, topRight }: { children: ReactNode; topRight?: ReactNode }) => (
    <div>
      {topRight}
      {children}
    </div>
  ),
}));

vi.mock('../BalanceSection', () => ({ BalanceSection: () => <div data-testid="balance" /> }));
// Иначе ряд «Привязать Telegram» подтянул бы настоящий authProvider (сетевой
// listAccounts) в jsdom — эти тесты про раскладку дровера, не про линковку.
vi.mock('../TelegramLinkRow', () => ({ TelegramLinkRow: () => null }));
vi.mock('../SignOutConfirmModal', () => ({ default: () => null }));
vi.mock('@/features/wallpaper', () => ({ WallpaperPicker: () => <div /> }));
vi.mock('@/features/card-palette', () => ({ CardPalettePicker: () => <div /> }));
vi.mock('@/features/sync-status/SyncStatusChip', () => ({ SyncStatusChip: () => <div /> }));

vi.mock('../ProfileDrawer.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `pd-${String(p)}` }),
}));
vi.mock('@/shared/ui/atoms/SettingRow/SettingRow.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `sr-${String(p)}` }),
}));

const { ProfileDrawer } = await import('../ProfileDrawer');

beforeEach(() => {
  mockShow.mockReset();
  mockAuth.signOut.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProfileDrawer (VariantD root)', () => {
  it('shows the data actions and sign-out row at rest — no accordions to expand', () => {
    render(<ProfileDrawer />);

    expect(screen.getByRole('button', { name: 'Скачать копию в файл' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Загрузить из файла' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /выйти из аккаунта/i })).toBeInTheDocument();
  });

  it('does not sign out when the typed-confirm modal is cancelled', async () => {
    mockShow.mockResolvedValue(false);
    render(<ProfileDrawer />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /выйти из аккаунта/i }));
    });

    expect(mockShow).toHaveBeenCalledOnce();
    expect(mockAuth.signOut).not.toHaveBeenCalled();
  });

  it('signs out only after the typed-confirm modal resolves true', async () => {
    mockShow.mockResolvedValue(true);
    render(<ProfileDrawer />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /выйти из аккаунта/i }));
    });

    expect(mockAuth.signOut).toHaveBeenCalledOnce();
  });
});
