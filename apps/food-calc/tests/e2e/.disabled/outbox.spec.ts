import { test, expect } from '@playwright/test';
import { installSupabaseMock, getRestCalls, resetRestCalls } from './supabaseMock';
import {
  clearStorage,
  drain,
  enqueueWrite,
  getPendingCount,
  readIdbPending,
  waitForBridge,
} from './helpers';

test.describe('outbox', () => {
  test('offline save survives: pending durable in IDB, drains on online (#3)', async ({
    page,
    context,
  }) => {
    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);
    await clearStorage(page);
    resetRestCalls(page);

    await context.setOffline(true);
    await enqueueWrite(page, 'products', 'upsert', {
      id: 'p-offline-1',
      user_id: 'e2e-user',
      name: 'offline product',
    });
    expect(await getPendingCount(page)).toBe(1);
    expect((await readIdbPending(page)).length).toBe(1);

    // Drain while offline must be a no-op (navigator.onLine === false → early return).
    await drain(page);
    expect(await getPendingCount(page)).toBe(1);
    const writeCallsOffline = getRestCalls(page).filter(
      (c) => c.url.includes('/rest/v1/') && c.method !== 'GET' && c.method !== 'HEAD',
    );
    expect(writeCallsOffline).toHaveLength(0);

    // Go online and drain.
    await context.setOffline(false);
    await drain(page);
    await expect.poll(async () => getPendingCount(page)).toBe(0);
    const restCalls = getRestCalls(page).filter((c) => c.url.includes('/rest/v1/products'));
    expect(restCalls.length).toBeGreaterThanOrEqual(1);
    expect((await readIdbPending(page)).length).toBe(0);
  });

  test('process kill before drain: pending survives reload, then drains (#4)', async ({
    page,
    context,
  }) => {
    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);
    await clearStorage(page);

    await context.setOffline(true);
    await enqueueWrite(page, 'products', 'upsert', { id: 'p-kill-1', user_id: 'e2e-user', name: 'a' });
    await enqueueWrite(page, 'products', 'upsert', { id: 'p-kill-2', user_id: 'e2e-user', name: 'b' });
    await enqueueWrite(page, 'products', 'upsert', { id: 'p-kill-3', user_id: 'e2e-user', name: 'c' });
    expect(await getPendingCount(page)).toBe(3);
    // Sanity: IDB contains 3 entries before reload.
    expect((await readIdbPending(page)).length).toBe(3);

    // Simulate process kill: reset call log, go online so the reloaded process can drain,
    // then full reload. SyncProvider boot calls primePendingCache → drain automatically.
    resetRestCalls(page);
    await context.setOffline(false);
    await page.reload();
    await waitForBridge(page);

    // After reload the SyncProvider auto-drains; the queue must end up empty,
    // and the mock must have seen at least 3 product upserts.
    await expect.poll(async () => getPendingCount(page)).toBe(0);
    await expect.poll(async () => (await readIdbPending(page)).length).toBe(0);
    const productWrites = getRestCalls(page).filter(
      (c) =>
        c.url.includes('/rest/v1/products') &&
        c.method !== 'GET' &&
        c.method !== 'HEAD',
    );
    expect(productWrites.length).toBeGreaterThanOrEqual(3);
  });
});
