// SignOutConfirmModal — the typed-«удалить» barrier gating sign-out. Semantics
// under test: the confirm button stays disabled until the exact word is typed
// (case/space-normalized), and resolves onClose(true) only then; cancel resolves
// false. ModalLayout/ModalShell are stubbed to passthroughs so the test isolates
// the barrier logic, not the shell chrome.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

vi.mock('@/shared/ui/ModalLayout', () => ({
  ModalLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/shared/ui/ModalShell', () => {
  function ModalShell({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  }
  function Body({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  }
  function Title({ children }: { children: ReactNode }) {
    return <h2>{children}</h2>;
  }
  ModalShell.Body = Body;
  ModalShell.Title = Title;
  return { ModalShell };
});

const runSyncTracked = vi.fn().mockResolvedValue(true);
vi.mock('@/shared/lib/sync/runSync', () => ({
  runSyncTracked: (...a: unknown[]) => runSyncTracked(...a),
}));

vi.mock('./SignOutConfirmModal.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `so-${String(p)}` }),
}));

const { default: SignOutConfirmModal } = await import('./SignOutConfirmModal');

const confirmBtn = () => screen.getByRole('button', { name: 'Выйти' });
const barrierField = () => screen.getByLabelText('Слово подтверждения');

beforeEach(() => {
  runSyncTracked.mockClear();
});

describe('SignOutConfirmModal (typed «удалить» barrier)', () => {
  it('confirm is disabled until the exact word is typed', () => {
    render(<SignOutConfirmModal syncEnabled onClose={vi.fn()} />);

    expect(confirmBtn()).toBeDisabled();

    fireEvent.change(barrierField(), { target: { value: 'удали' } });
    expect(confirmBtn()).toBeDisabled();

    fireEvent.change(barrierField(), { target: { value: 'удалить' } });
    expect(confirmBtn()).toBeEnabled();
  });

  it('normalizes case and surrounding spaces', () => {
    render(<SignOutConfirmModal syncEnabled onClose={vi.fn()} />);
    fireEvent.change(barrierField(), { target: { value: '  УДАЛИТЬ ' } });
    expect(confirmBtn()).toBeEnabled();
  });

  it('resolves onClose(true) only after the barrier is armed', () => {
    const onClose = vi.fn();
    render(<SignOutConfirmModal syncEnabled onClose={onClose} />);

    // Disabled button — click is a no-op.
    fireEvent.click(confirmBtn());
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.change(barrierField(), { target: { value: 'удалить' } });
    fireEvent.click(confirmBtn());
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('cancel resolves onClose(false)', () => {
    const onClose = vi.fn();
    render(<SignOutConfirmModal syncEnabled onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(onClose).toHaveBeenCalledWith(false);
  });
});
