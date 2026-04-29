import { test, expect } from '@playwright/test';
import { installSupabaseMock } from './supabaseMock';
import {
  waitForBridge,
  countLocal,
  countDirty,
  drainPush,
} from './helpers';

// Step 5 smoke for the Dexie + backup-polling rewrite. Validates the boot
// sequence and one round-trip of the create/drain/reload cycle so we catch
// runtime regressions tsc + lint can't see.

test.describe('Dexie smoke (Step 5)', () => {
  test('boot: bridge installs, session non-null, no console errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });

    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);

    const session = await page.evaluate(async () => {
      const e2e = (
        window as unknown as {
          __e2e: {
            getSession: () => Promise<{
              user: { id: string; is_anonymous: boolean };
            } | null>;
          };
        }
      ).__e2e;
      return e2e.getSession();
    });
    expect(session).not.toBeNull();
    expect(session?.user.id).toBe('e2e-user');
    expect(session?.user.is_anonymous).toBe(false);

    // After a clean boot Dexie should be empty (snapshot returned {} so
    // pullSnapshot writes 0 rows).
    const counts = await countLocal(page);
    for (const t of Object.keys(counts)) expect(counts[t]).toBe(0);

    // The page itself rendered something (root #root is non-empty).
    const rootHtml = await page.locator('#root').innerHTML();
    expect(rootHtml.length).toBeGreaterThan(0);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('create product → drain → reload → row reappears', async ({ page }) => {
    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);

    // Insert a product directly through Dexie to bypass UI flows; the goal
    // here is the storage round-trip, not the create modal.
    await page.evaluate(async () => {
      const w = window as unknown as {
        Dexie?: unknown;
      };
      void w;
      // Use the bridge's wipe helper to start clean.
      const e2e = (
        window as unknown as { __e2e: { wipeLocal: () => Promise<void> } }
      ).__e2e;
      await e2e.wipeLocal();
    });

    const userId = 'e2e-user';

    // Drive a create through the actual mutation path so hooks run.
    await page.evaluate(async () => {
      const mod = await import('/src/entities/product/api/mutations.ts');
      await (mod as { createProduct: (p: { name: string }) => Promise<string> })
        .createProduct({ name: 'Smoke Carrot' });
    });

    let local = await countLocal(page);
    expect(local.products).toBe(1);

    let dirty = await countDirty(page, userId);
    expect(dirty.products).toBe(1);

    const drainResult = await drainPush(page, userId);
    expect(drainResult.accepted).toBe(1);
    expect(drainResult.rejected).toBe(0);

    dirty = await countDirty(page, userId);
    expect(dirty.products).toBe(0);

    // Reload — Dexie row must persist; counts unchanged.
    await page.reload();
    await waitForBridge(page);
    local = await countLocal(page);
    expect(local.products).toBe(1);
  });
});
