import type { Page } from '@playwright/test';

/**
 * Wait until window.__e2e bridge is installed and SyncProvider has booted
 * (anonymous session present, primePendingCache + drain settled).
 */
export async function waitForBridge(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const e2e = (window as unknown as { __e2e?: Record<string, unknown> }).__e2e;
      return !!e2e && typeof e2e.getPendingCount === 'function';
    },
    { timeout: 30_000 },
  );
  // Allow SyncProvider boot (getSession → signInAnonymously → primePendingCache → drain).
  await page.waitForFunction(
    async () => {
      const e2e = (window as unknown as {
        __e2e: { getSession: () => Promise<unknown> };
      }).__e2e;
      const s = await e2e.getSession();
      return s !== null && s !== undefined;
    },
    { timeout: 15_000 },
  );
}

export async function getPendingCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const e2e = (window as unknown as { __e2e: { getPendingCount: () => number } }).__e2e;
    return e2e.getPendingCount();
  });
}

export async function readIdbPending(page: Page): Promise<unknown[]> {
  return page.evaluate(async () => {
    const e2e = (window as unknown as {
      __e2e: { readIdbPending: () => Promise<unknown[] | undefined> };
    }).__e2e;
    return (await e2e.readIdbPending()) ?? [];
  });
}

export async function enqueueWrite(
  page: Page,
  table: string,
  op: 'insert' | 'update' | 'upsert' | 'delete',
  payload: Record<string, unknown>,
): Promise<void> {
  await page.evaluate(
    async ({ table, op, payload }) => {
      const e2e = (window as unknown as {
        __e2e: {
          enqueue: (w: {
            table: string;
            op: string;
            payload: Record<string, unknown>;
          }) => Promise<void>;
        };
      }).__e2e;
      await e2e.enqueue({ table, op, payload });
    },
    { table, op, payload },
  );
}

export async function drain(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const e2e = (window as unknown as { __e2e: { drain: () => Promise<void> } }).__e2e;
    await e2e.drain();
  });
}

/**
 * Clears outbox + IDB. Leaves localStorage (auth session) intact so the in-memory
 * supabase-js client stays consistent with persisted state.
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const e2e = (window as unknown as {
      __e2e: { clearPending: () => Promise<void>; clearIdb: () => Promise<void> };
    }).__e2e;
    await e2e.clearPending();
    await e2e.clearIdb();
  });
}
