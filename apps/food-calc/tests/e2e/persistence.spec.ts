import { test, expect } from '@playwright/test';
import { installSupabaseMock, setSupabaseMode } from './supabaseMock';
import { clearStorage, enqueueWrite, readIdbPending, waitForBridge } from './helpers';

async function readIdbKeys(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(async () => {
    const e2e = (window as unknown as { __e2e: { idbKeys: () => Promise<string[]> } }).__e2e;
    return e2e.idbKeys();
  });
}

test.describe('persistence', () => {
  test('IDB cache survives reload (#2 reload-offline, online reload to keep vite reachable)', async ({
    page,
  }) => {
    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);
    await clearStorage(page);

    // Trigger TanStack Query persister to flush by writing through the cache.
    await page.evaluate(async () => {
      const e2e = (window as unknown as {
        __e2e: { invalidateAllQueries: () => Promise<void> };
      }).__e2e;
      await e2e.invalidateAllQueries();
    });
    // Allow throttled persister (1s) to flush.
    await page.waitForTimeout(1500);

    const beforeKeys = await readIdbKeys(page);
    expect(beforeKeys.some((k) => k.includes('rq-cache'))).toBe(true);

    // Reload (online — Playwright's setOffline blocks even localhost, so we test
    // that IDB *survives* a reload, which is what offline-PWA durability boils down to).
    await page.reload();
    await waitForBridge(page);

    const afterKeys = await readIdbKeys(page);
    expect(afterKeys.some((k) => k.includes('rq-cache'))).toBe(true);
  });

  test('PWA-style durability: pendingWrites + auth session survive reload (#11 degraded)', async ({
    page,
  }) => {
    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);
    await clearStorage(page);
    // SyncProvider's signInAnonymously writes the auth-token to localStorage during boot.
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            Object.keys(localStorage).some((k) => k.includes('-auth-token')),
          ),
        { timeout: 10_000 },
      )
      .toBe(true);

    // Pre-populate the outbox. Switch the mock to 5xx so the post-reload boot
    // drain keeps retrying instead of clearing the queue — that lets us assert
    // the IDB row actually survived the reload.
    setSupabaseMode(page, 'fail-5xx');
    await enqueueWrite(page, 'products', 'upsert', {
      id: 'p-pwa',
      user_id: 'e2e-user',
      name: 'pwa-survival',
    });
    expect((await readIdbPending(page)).length).toBe(1);

    // Reload (online) — both must survive.
    await page.reload();
    await waitForBridge(page);

    await expect.poll(async () => (await readIdbPending(page)).length).toBe(1);
    const stillHasAuth = await page.evaluate(() =>
      Object.keys(localStorage).some((k) => k.includes('-auth-token')),
    );
    expect(stillHasAuth).toBe(true);
  });
});
