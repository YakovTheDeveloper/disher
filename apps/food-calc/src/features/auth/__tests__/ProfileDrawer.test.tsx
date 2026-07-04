// ProfileDrawer — account drawer: theme picker + collapsed «Опасная зона»
// holding the manual backup and the hold-to-sign-out control. Heavy children
// (DrawerLayout, ThemePicker, HoldButton) are stubbed so the test isolates the
// drawer's own logic: section collapse, backup states, sign-out trigger.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

const mockAuth = { email: 'user@example.com', signOut: vi.fn() };
vi.mock('../auth-store', () => ({
  useAuthStore: (selector: (s: typeof mockAuth) => unknown) => selector(mockAuth),
}));

const mockSync = vi.fn();
vi.mock('@/shared/lib/snapshot', () => ({
  syncNow: () => mockSync(),
  dump: vi.fn(),
  apply: vi.fn(),
}));

vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ children, footer }: { children: ReactNode; footer?: ReactNode }) => (
    <div>
      {children}
      {footer}
    </div>
  ),
}));

vi.mock('@/features/theme', () => ({
  ThemePicker: () => <div data-testid="theme-picker" />,
}));

vi.mock('../HoldButton', () => ({
  HoldButton: (props: {
    onComplete: () => void;
    label: string;
    busyLabel: string;
    busy?: boolean;
  }) => (
    <button data-testid="hold-button" onClick={props.onComplete}>
      {props.busy ? props.busyLabel : props.label}
    </button>
  ),
}));

vi.mock('../ProfileDrawer.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `pd-${String(p)}` }),
}));

const { ProfileDrawer } = await import('../ProfileDrawer');

const expandDanger = () => {
  fireEvent.click(screen.getByRole('button', { name: /опасная зона/i }));
};

beforeEach(() => {
  vi.useFakeTimers();
  mockSync.mockReset();
  mockAuth.signOut.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ProfileDrawer', () => {
  it('shows the theme picker but keeps the danger zone collapsed by default', () => {
    render(<ProfileDrawer />);

    expect(screen.getByTestId('theme-picker')).toBeInTheDocument();
    // «Опасная зона» is now the `Accordion` primitive, which ALWAYS mounts its
    // body (collapse is grid-reveal + `aria-expanded`, not unmount). So the
    // collapsed contract is the header reporting `aria-expanded="false"`, not
    // the sign-out/backup controls being absent from the DOM.
    expect(
      screen.getByRole('button', { name: /опасная зона/i }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('reveals the backup + sign-out controls when the danger zone is expanded', () => {
    render(<ProfileDrawer />);
    expandDanger();

    expect(
      screen.getByRole('button', { name: 'Сохранить в хранилище' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('hold-button')).toBeInTheDocument();
  });

  it('runs a manual backup and resets the label back to idle after a beat', async () => {
    mockSync.mockResolvedValue(undefined);
    render(<ProfileDrawer />);
    expandDanger();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Сохранить в хранилище' }),
      );
    });

    expect(mockSync).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('button', { name: 'Сохранено ✓' }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByRole('button', { name: 'Сохранить в хранилище' }),
    ).toBeInTheDocument();
  });

  it('surfaces a failed backup and logs it', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSync.mockRejectedValue(new Error('network down'));
    render(<ProfileDrawer />);
    expandDanger();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Сохранить в хранилище' }),
      );
    });

    expect(
      screen.getByRole('button', { name: 'Не удалось — повторить' }),
    ).toBeInTheDocument();
    expect(errSpy).toHaveBeenCalled();
  });

  it('signs out when the hold-to-confirm control completes', async () => {
    render(<ProfileDrawer />);
    expandDanger();

    await act(async () => {
      fireEvent.click(screen.getByTestId('hold-button'));
    });

    expect(mockAuth.signOut).toHaveBeenCalledOnce();
  });

  it('keeps the data import/export actions behind a collapsed «Данные» accordion by default', () => {
    render(<ProfileDrawer />);

    // The `Accordion` primitive always mounts its body, so collapse is signalled
    // by `aria-expanded="false"` on the header (grid-reveal + a11y), not by the
    // actions being absent from the DOM.
    const dataHeader = screen.getByRole('button', { name: /данные/i });
    expect(dataHeader).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(dataHeader);

    expect(dataHeader).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('button', { name: 'Скачать файл' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Загрузить из файла' }),
    ).toBeInTheDocument();
  });
});
