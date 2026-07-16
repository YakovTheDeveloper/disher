// @vitest-environment jsdom
// AccountPanel — клик открывает ProfileDrawer слева; aria-label включает email.
// Контракт сменился 2026-05-20 (буква-аватар → шестерёнка-настройки),
// smoke-тест защищает от регрессии shape'а.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import AccountPanel from './AccountPanel';
import { ProfileDrawer } from './ProfileDrawer';
import { useAuthStore } from './auth-store';

// Полный shape store'а вытащен из самого useAuthStore — если AuthState/Actions
// изменятся, typecheck заставит обновить factory. Иначе мок с partial-shape
// тихо пропустит компонент, читающий новое поле, до runtime'а.
type AuthStoreShape = ReturnType<typeof useAuthStore.getState>;

const makeStore = (override: Partial<AuthStoreShape> = {}): AuthStoreShape => ({
  isLoggedIn: false,
  email: null,
  userId: null,
  role: null,
  isReady: true,
  isLoading: false,
  error: null,
  errorKind: null,
  pendingVerificationEmail: null,
  clearError: vi.fn(),
  bootstrap: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  logout: vi.fn(),
  signInWithTelegram: vi.fn(),
  linkTelegram: vi.fn(),
  reportOAuthReturnError: vi.fn(),
  requestResendVerification: vi.fn(),
  clearPendingVerification: vi.fn(),
  ...override,
});

const h = vi.hoisted(() => ({
  drawerShow: vi.fn(),
  email: 'test@example.com' as string | null,
}));

vi.mock('./AccountPanel.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `ap-${String(p)}` }),
}));
vi.mock('./auth-store', () => ({
  // Реальный useAuthStore — это zustand-хук с overload'ом (selector?: ...).
  // Возвращаем factory-shape, чтобы селектор любой формы получил полный объект.
  useAuthStore: Object.assign(
    <T,>(selector: (s: AuthStoreShape) => T) => selector(makeStore({ email: h.email })),
    { getState: () => makeStore({ email: h.email }) },
  ),
}));
vi.mock('@/shared/ui/drawer-store', () => ({
  drawerStore: { show: h.drawerShow },
}));
vi.mock('./ProfileDrawer', () => ({ ProfileDrawer: () => null }));
vi.mock('@/shared/assets/icons/more.svg?react', () => ({
  default: (props: object) => <svg data-testid="settings-icon" {...props} />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  h.email = 'test@example.com';
});

describe('AccountPanel', () => {
  it('renders settings icon (not a letter-avatar)', () => {
    const { queryByTestId, queryByText } = render(<AccountPanel />);
    expect(queryByTestId('settings-icon')).not.toBeNull();
    // Старый контракт — первая буква email в кружке. Защищаемся.
    expect(queryByText('T')).toBeNull();
  });

  it('click opens ProfileDrawer with side: left', () => {
    const { getByRole } = render(<AccountPanel />);
    fireEvent.click(getByRole('button'));
    expect(h.drawerShow).toHaveBeenCalledTimes(1);
    expect(h.drawerShow).toHaveBeenCalledWith(ProfileDrawer, {}, { side: 'left' });
  });

  it('aria-label includes email when logged in', () => {
    const { getByRole } = render(<AccountPanel />);
    expect(getByRole('button').getAttribute('aria-label')).toBe(
      'Настройки и аккаунт test@example.com',
    );
  });

  it('aria-label falls back when email is null (brief signOut window)', () => {
    h.email = null;
    const { getByRole } = render(<AccountPanel />);
    expect(getByRole('button').getAttribute('aria-label')).toBe('Настройки и аккаунт');
  });
});
