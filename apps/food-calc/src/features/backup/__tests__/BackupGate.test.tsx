import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const h = vi.hoisted(() => ({ localCount: 0, syncEnabled: true }));

// Mock the boot dependencies so the gate is tested in isolation (no real Dexie
// row-counts, no real syncNow network).
vi.mock('@/shared/lib/dexie/schema', () => ({
  db: { tables: [{ count: async () => h.localCount }] },
}));
vi.mock('@/shared/lib/sync-pref', () => ({ isSyncEnabled: () => h.syncEnabled }));
vi.mock('@/shared/lib/sync/runSync', () => ({ runSyncTracked: vi.fn(async () => true) }));

import { runSyncTracked } from '@/shared/lib/sync/runSync';
import { BackupGate } from '../BackupGate';

const mockSync = vi.mocked(runSyncTracked);

beforeEach(() => {
  h.localCount = 0;
  h.syncEnabled = true;
  mockSync.mockClear();
});

afterEach(() => cleanup());

describe('BackupGate', () => {
  it('renders children without syncing when sync is disabled', async () => {
    h.syncEnabled = false;
    render(<BackupGate><div>ребёнок</div></BackupGate>);

    await waitFor(() => expect(screen.getByText('ребёнок')).toBeInTheDocument());
    expect(mockSync).not.toHaveBeenCalled();
  });

  it('blocks on first launch (empty local) until the pull+merge lands, then renders', async () => {
    h.localCount = 0;
    render(<BackupGate><div>ребёнок</div></BackupGate>);

    await waitFor(() => expect(screen.getByText('ребёнок')).toBeInTheDocument());
    expect(mockSync).toHaveBeenCalledOnce();
  });

  it('renders immediately and reconciles in the background when local data exists', async () => {
    h.localCount = 5;
    render(<BackupGate><div>ребёнок</div></BackupGate>);

    await waitFor(() => expect(screen.getByText('ребёнок')).toBeInTheDocument());
    expect(mockSync).toHaveBeenCalledOnce();
  });
});
