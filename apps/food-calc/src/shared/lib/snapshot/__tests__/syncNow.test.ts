import { describe, it, expect, beforeEach, vi } from 'vitest';

// syncNow() is the single sync path (BackupGate mount + manual buttons). We mock
// the only HTTP transport (authedFetch) so the pull (GET) and push (PUT) show up
// as recorded calls.
//
// This file used to test the privacy chokepoint — syncNow() refusing to move data
// while the per-device consent flag was OFF. That flag was removed 2026-07-16
// (sync is always on; the server is the only store), so the gate it guarded no
// longer exists. What survives is the transport contract: pull, then push.

const authedFetch = vi.fn();
vi.mock('@/shared/lib/api/authedFetch', () => ({
  authedFetch: (...args: unknown[]) => authedFetch(...args),
}));

import { syncNow } from '@/shared/lib/snapshot';

const makeResponse = (status: number) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({}),
  }) as Response;

beforeEach(() => {
  authedFetch.mockReset();
  // GET (pull) → 404 empty vault → pull() returns null; PUT (push) → 204 ok.
  authedFetch.mockImplementation((_url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (method === 'PUT') return Promise.resolve(makeResponse(204));
    return Promise.resolve(makeResponse(404));
  });
});

describe('syncNow', () => {
  it('pulls before pushing', async () => {
    await syncNow();
    const methods = authedFetch.mock.calls.map((c) => c[1]?.method ?? 'GET');
    expect(methods).toEqual(['GET', 'PUT']);
  });
});
