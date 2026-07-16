// SignOutConfirmModal — the typed-«удалить» barrier gating sign-out. Semantics
// under test: the confirm button stays disabled until the exact word is typed
// (case/space-normalized); an armed confirm runs the final sync and resolves
// onClose(true) only if it lands — a failed sync flips to the "выйти всё равно?"
// branch instead of silently wiping unsynced edits. Cancel resolves false.
// ModalLayout/ModalShell are stubbed to passthroughs so the test isolates the
// barrier logic, not the shell chrome.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

const finalSyncBeforeSignOut = vi.fn().mockResolvedValue(true);
vi.mock('./auth-store', () => ({
  finalSyncBeforeSignOut: () => finalSyncBeforeSignOut(),
}));

vi.mock('./SignOutConfirmModal.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `so-${String(p)}` }),
}));

const { default: SignOutConfirmModal } = await import('./SignOutConfirmModal');

const confirmBtn = () => screen.getByRole('button', { name: 'Выйти' });
const barrierField = () => screen.getByLabelText('Слово подтверждения');

beforeEach(() => {
  runSyncTracked.mockClear();
  finalSyncBeforeSignOut.mockClear();
  finalSyncBeforeSignOut.mockResolvedValue(true);
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

  it('resolves onClose(true) only after the barrier is armed + the final sync lands', async () => {
    const onClose = vi.fn();
    render(<SignOutConfirmModal syncEnabled onClose={onClose} />);

    // Disabled button — click is a no-op.
    fireEvent.click(confirmBtn());
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.change(barrierField(), { target: { value: 'удалить' } });
    fireEvent.click(confirmBtn());

    await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
    expect(finalSyncBeforeSignOut).toHaveBeenCalledOnce();
  });

  it('cancel resolves onClose(false)', () => {
    const onClose = vi.fn();
    render(<SignOutConfirmModal syncEnabled onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it('sync OFF: no final sync to run — confirm resolves straight through', async () => {
    const onClose = vi.fn();
    render(<SignOutConfirmModal syncEnabled={false} onClose={onClose} />);

    fireEvent.change(barrierField(), { target: { value: 'удалить' } });
    fireEvent.click(confirmBtn());

    await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
    expect(finalSyncBeforeSignOut).not.toHaveBeenCalled();
  });
});

// The prod trap this branch closes: the final push failed (offline / hung
// server), so the edits since the last sync exist ONLY in the Dexie the sign-out
// is about to wipe. Never resolve true behind the user's back — ask.
describe('SignOutConfirmModal (failed final sync)', () => {
  const arm = (onClose: (v?: boolean) => void) => {
    render(<SignOutConfirmModal syncEnabled onClose={onClose} />);
    fireEvent.change(barrierField(), { target: { value: 'удалить' } });
    fireEvent.click(confirmBtn());
  };

  it('does not sign out on its own — it warns and waits', async () => {
    const onClose = vi.fn();
    finalSyncBeforeSignOut.mockResolvedValue(false);

    arm(onClose);

    await screen.findByText('Не удалось сохранить в облако');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('«Всё равно выйти» resolves true (informed data loss)', async () => {
    const onClose = vi.fn();
    finalSyncBeforeSignOut.mockResolvedValue(false);

    arm(onClose);
    fireEvent.click(await screen.findByRole('button', { name: 'Всё равно выйти' }));

    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('«Остаться» resolves false — the session survives', async () => {
    const onClose = vi.fn();
    finalSyncBeforeSignOut.mockResolvedValue(false);

    arm(onClose);
    fireEvent.click(await screen.findByRole('button', { name: 'Остаться' }));

    expect(onClose).toHaveBeenCalledWith(false);
  });
});
