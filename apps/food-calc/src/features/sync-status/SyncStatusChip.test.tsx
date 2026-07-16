// SyncStatusChip — ambient sync-status. Semantics under test: the failed state
// renders the status text PLUS a separate retry button (not one merged string),
// and tapping the retry fires runSyncTracked. Stores/hooks are stubbed so the
// test isolates the chip's own state→render mapping.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mockSync = { state: 'failed' as 'idle' | 'syncing' | 'synced' | 'failed' };
vi.mock('@/shared/lib/sync/sync-status-store', () => ({
  useSyncStatusStore: (sel: (s: typeof mockSync) => unknown) => sel(mockSync),
}));

const runSyncTracked = vi.fn();
vi.mock('@/shared/lib/sync/runSync', () => ({
  runSyncTracked: (...a: unknown[]) => runSyncTracked(...a),
}));

const mockOnline = { value: true };
vi.mock('@/shared/lib/hooks/useOnline', () => ({ useOnline: () => mockOnline.value }));

vi.mock('./SyncStatusChip.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `ssc-${String(p)}` }),
}));

const { SyncStatusChip } = await import('./SyncStatusChip');

beforeEach(() => {
  runSyncTracked.mockReset();
  mockSync.state = 'failed';
  mockOnline.value = true;
});

describe('SyncStatusChip', () => {
  it('failed: status text and retry are separate, retry fires runSyncTracked', () => {
    render(<SyncStatusChip />);

    // Статус — текст; действие — отдельная кнопка (а не одна слитая строка).
    expect(screen.getByText('Не сохранено')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: 'Повторить синхронизацию' });
    expect(retry).toBeInTheDocument();
    // Текст статуса НЕ внутри кнопки — иначе снова слились бы в одну мишень.
    expect(retry).not.toHaveTextContent('Не сохранено');

    fireEvent.click(retry);
    expect(runSyncTracked).toHaveBeenCalledOnce();
    expect(runSyncTracked).toHaveBeenCalledWith({ surfaceToast: true });
  });

  it('renders nothing at rest (idle/synced, online)', () => {
    mockSync.state = 'synced';
    const { container } = render(<SyncStatusChip />);
    expect(container).toBeEmptyDOMElement();
  });

  it('offline: shows «Офлайн», no retry button', () => {
    mockOnline.value = false;
    render(<SyncStatusChip />);
    expect(screen.getByText('Офлайн')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
