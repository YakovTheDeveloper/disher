import { test, expect } from '@playwright/test';
import { installSupabaseMock, getRestCalls, resetRestCalls } from './supabaseMock';
import {
  clearStorage,
  drain,
  enqueueWrite,
  getPendingCount,
  waitForBridge,
} from './helpers';

test.describe('offline gates', () => {
  test('drain is a no-op while offline; does not retry network (#5 compound-gate proxy)', async ({
    page,
    context,
  }) => {
    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);
    await clearStorage(page);
    resetRestCalls(page);

    await context.setOffline(true);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);

    await enqueueWrite(page, 'dishes', 'upsert', {
      id: 'd-1',
      user_id: 'e2e-user',
      name: 'gated dish',
    });
    await drain(page);
    expect(await getPendingCount(page)).toBe(1);
    // Drain must not have issued a write while offline (reads from useQuery may still happen).
    const writeCalls = getRestCalls(page).filter(
      (c) => c.url.includes('/rest/v1/') && c.method !== 'GET' && c.method !== 'HEAD',
    );
    expect(writeCalls).toHaveLength(0);
  });

  test('navigator.onLine flips through context.setOffline (#6 free-text-gate proxy)', async ({
    page,
    context,
  }) => {
    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);

    expect(await page.evaluate(() => navigator.onLine)).toBe(true);

    await context.setOffline(true);
    await expect.poll(async () => page.evaluate(() => navigator.onLine)).toBe(false);

    await context.setOffline(false);
    await expect.poll(async () => page.evaluate(() => navigator.onLine)).toBe(true);
  });
});
