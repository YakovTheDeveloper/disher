import type { Page } from '@playwright/test';

type DexieBridge = {
  countLocal: () => Promise<Record<string, number>>;
  countDirty: (userId: string) => Promise<Record<string, number>>;
  wipeLocal: () => Promise<void>;
  drainPush: (userId: string) => Promise<{ accepted: number; rejected: number }>;
  pullSnapshot: () => Promise<{ rows: number }>;
  clearIdb: () => Promise<void>;
  idbKeys: () => Promise<string[]>;
  getSession: () => Promise<{ user: { id: string; is_anonymous: boolean } } | null>;
  signOut: () => Promise<void>;
};

/**
 * Wait until window.__e2e bridge is installed and SyncProvider has booted
 * (session present, Dexie hooks installed).
 */
export async function waitForBridge(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const e2e = (window as unknown as { __e2e?: { countLocal?: unknown } }).__e2e;
      return !!e2e && typeof e2e.countLocal === 'function';
    },
    { timeout: 30_000 },
  );
  await page.waitForFunction(
    async () => {
      const e2e = (window as unknown as { __e2e: DexieBridge }).__e2e;
      const s = await e2e.getSession();
      return s !== null && s !== undefined;
    },
    { timeout: 15_000 },
  );
}

export async function countLocal(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() =>
    (window as unknown as { __e2e: DexieBridge }).__e2e.countLocal(),
  );
}

export async function countDirty(
  page: Page,
  userId: string,
): Promise<Record<string, number>> {
  return page.evaluate(
    (uid) =>
      (window as unknown as { __e2e: DexieBridge }).__e2e.countDirty(uid),
    userId,
  );
}

export async function wipeLocal(page: Page): Promise<void> {
  await page.evaluate(() =>
    (window as unknown as { __e2e: DexieBridge }).__e2e.wipeLocal(),
  );
}

export async function drainPush(
  page: Page,
  userId: string,
): Promise<{ accepted: number; rejected: number }> {
  return page.evaluate(
    (uid) =>
      (window as unknown as { __e2e: DexieBridge }).__e2e.drainPush(uid),
    userId,
  );
}
