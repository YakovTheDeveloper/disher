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
    // WebKit logs harmless viewport-meta warnings as console.error; ignore.
    const IGNORED_CONSOLE = [
      'Viewport argument key "interactive-widget"',
    ];
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (IGNORED_CONSOLE.some((needle) => text.includes(needle))) return;
      errors.push(`console: ${text}`);
    });

    await installSupabaseMock(page, 'ok');
    await page.goto('/');
    await waitForBridge(page);

    const session = await page.evaluate(async () => {
      const e2e = (
        window as unknown as {
          __e2e: {
            signInTest: () => Promise<unknown>;
            getSession: () => Promise<{
              user: { id: string; is_anonymous: boolean };
            } | null>;
          };
        }
      ).__e2e;
      await e2e.signInTest();
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

    // Sign in so getUserIdSync() inside createProduct returns a real id.
    await page.evaluate(async () => {
      const e2e = (
        window as unknown as { __e2e: { signInTest: () => Promise<unknown> } }
      ).__e2e;
      await e2e.signInTest();
    });

    // Wait for SyncProvider to install Dexie hooks (runs in a React effect
    // after isLoggedIn flips). Without this createProduct races and inserts
    // the row before _dirty/edit_count auto-stamping is wired up.
    await page.waitForFunction(
      () =>
        Boolean(
          (window as unknown as { __e2e?: { hooksInstalled?: () => boolean } })
            .__e2e?.hooksInstalled?.(),
        ),
      undefined,
      { timeout: 10_000 },
    );

    // Wipe Dexie to start clean (signIn may have triggered snapshot pull).
    await page.evaluate(async () => {
      const e2e = (
        window as unknown as { __e2e: { wipeLocal: () => Promise<void> } }
      ).__e2e;
      await e2e.wipeLocal();
    });

    const userId = 'e2e-user';

    // Drive a create through the actual mutation path so hooks run.
    // Bridge proxies the real entity mutation — no fragile module-path import.
    await page.evaluate(async () => {
      const e2e = (
        window as unknown as {
          __e2e: { createProduct: (p: { name: string }) => Promise<string> };
        }
      ).__e2e;
      await e2e.createProduct({ name: 'Smoke Carrot' });
    });

    let local = await countLocal(page);
    expect(local.products).toBe(1);

    // Skip the intermediate "dirty===1" check: scheduleCold() inside
    // createProduct races with the boot-kick drainNow() that startScheduler()
    // fires. Instead, drive a deterministic drainPush ourselves and assert
    // the row ends up clean.
    await drainPush(page, userId);

    const dirty = await countDirty(page, userId);
    expect(dirty.products).toBe(0);

    // Reload — Dexie row must persist; counts unchanged.
    await page.reload();
    await waitForBridge(page);
    local = await countLocal(page);
    expect(local.products).toBe(1);
  });
});
