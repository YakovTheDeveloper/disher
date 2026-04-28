import { test, expect } from '@playwright/test';
import { installSupabaseMock } from './supabaseMock';
import { waitForBridge } from './helpers';

test.describe('boot', () => {
  test('SyncProvider boots: anon session present, e2e bridge ready', async ({ page }) => {
    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);

    const session = await page.evaluate(async () => {
      const e2e = (window as unknown as {
        __e2e: { getSession: () => Promise<{ user: { id: string; is_anonymous: boolean } } | null> };
      }).__e2e;
      return e2e.getSession();
    });
    expect(session).not.toBeNull();
    expect(session?.user.is_anonymous).toBe(true);
  });
});
