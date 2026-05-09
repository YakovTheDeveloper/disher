/**
 * E2E test bridge — exposed on window only when MODE === 'test'.
 * Lets Playwright drive Dexie / backup / auth state without touching real UI.
 * Tree-shaken out in production builds.
 */
import { authProvider } from '@/shared/lib/auth/authProvider';
import { authClient } from '@/shared/lib/auth/betterAuthClient';
import { API_BASE } from '@/shared/lib/api/base';
import { db } from '@/shared/lib/dexie/schema';
import { push, pull, apply } from '@/shared/lib/snapshot';
import { createProduct } from '@/entities/product/api/mutations';

export function installE2EBridge(): void {
  if (import.meta.env.MODE !== 'test') return;
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>).__e2e = {
    countLocal: async () => {
      const out: Record<string, number> = {};
      for (const t of db.tables) out[t.name] = await t.count();
      return out;
    },
    wipeLocal: async () => {
      await db.transaction('rw', db.tables, async () => {
        await Promise.all(db.tables.map((t) => t.clear()));
      });
    },
    pushSnapshot: push,
    pullSnapshot: async () => {
      const snap = await pull();
      if (snap) await apply(snap);
      return snap;
    },

    createProduct,

    getSession: async () => {
      const user = authProvider.getCurrentUser();
      const accessToken = await authProvider.getAccessToken();
      return user && accessToken ? { user, access_token: accessToken } : null;
    },
    signInTest: async (email = 'e2e@disher.test', password = 'e2e-password') => {
      const result = await authProvider.signIn(email, password);
      if (!result.ok) throw new Error(result.error.message);
      const accessToken = await authProvider.getAccessToken();
      return { user: result.user, access_token: accessToken };
    },
    signOut: async () => {
      await authProvider.signOut();
    },

    verifyEmail: async (email: string) => {
      const res = await fetch(
        `${API_BASE}/api/dev/verify-tokens?email=${encodeURIComponent(email)}`,
      );
      if (!res.ok) {
        throw new Error(
          `dev verify-tokens lookup failed: ${res.status} ${res.statusText}`,
        );
      }
      const { token } = (await res.json()) as { token: string };
      const result = await authClient.verifyEmail({ query: { token } });
      if (result.error) {
        throw new Error(
          `authClient.verifyEmail failed: ${result.error.message ?? result.error.statusText ?? 'unknown'}`,
        );
      }
      return { ok: true };
    },
  };
}
