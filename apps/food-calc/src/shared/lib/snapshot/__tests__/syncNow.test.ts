import { describe, it, expect, beforeEach, vi } from 'vitest';

// Privacy chokepoint: syncNow() must not let user data leave the device when the
// per-device consent flag (sync-pref) is OFF. We mock the only HTTP transport
// (authedFetch) so any pull (GET) or push (PUT) shows up as a recorded call,
// and drive the real sync-pref store via setState — this exercises the real
// isSyncEnabled() wiring, not a stubbed gate.

const authedFetch = vi.fn();
vi.mock('@/shared/lib/api/authedFetch', () => ({
  authedFetch: (...args: unknown[]) => authedFetch(...args),
}));

import { syncNow } from '@/shared/lib/snapshot';
import { useSyncPrefStore } from '@/shared/lib/sync-pref';

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
  useSyncPrefStore.setState({ syncEnabled: true });
});

describe('syncNow privacy gate', () => {
  it('does NOT pull or push when sync is disabled', async () => {
    useSyncPrefStore.setState({ syncEnabled: false });
    await syncNow();
    expect(authedFetch).not.toHaveBeenCalled();
  });

  it('pushes when sync is enabled', async () => {
    useSyncPrefStore.setState({ syncEnabled: true });
    await syncNow();
    const methods = authedFetch.mock.calls.map((c) => c[1]?.method ?? 'GET');
    expect(methods).toContain('PUT');
  });
});
