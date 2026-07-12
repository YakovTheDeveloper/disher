import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { probeAdmin } from '@/shared/lib/api/admin';

// Client-side admin gate. UX only — never a security boundary (the server
// guards every /api/admin route). `isAdmin` is:
//   true  — is an admin (role 'admin' fast-path, OR the probe said so);
//   false — definitively not (probe 401/403), or logged out;
//   null  — still deciding (probe in flight) OR a transient network failure —
//           callers should render a loader, NOT bounce the user.
//
// Env-admins carry role 'user' in the DB, so a non-'admin' role is NOT proof of
// non-admin — we fall back to a `GET /api/admin/me` probe. Its verdict is cached
// per-userId (module-level, survives remounts) so navigating in and out of the
// admin page doesn't re-probe. A network failure is deliberately NOT cached
// (otherwise an admin would stick as "non-admin" until a full reload) — but that
// left a mount stuck at `null` forever, so `retry()` re-runs the probe in place
// (a transient miss actually re-probes since it was never cached; a decided
// verdict is cached and re-resolves to the same value — retry is a no-op there).

const probeCache = new Map<string, boolean>();

export interface AdminGate {
  isAdmin: boolean | null;
  /** Re-run the probe after a transient (network) failure. No-op once decided. */
  retry: () => void;
}

export function useAdminGate(): AdminGate {
  const userId = useAuthStore((s) => s.userId);
  const role = useAuthStore((s) => s.role);
  const isRoleAdmin = role === 'admin';

  // Seed from the cache synchronously so a cached verdict paints on first frame.
  const [probed, setProbed] = useState<boolean | null>(() =>
    userId && probeCache.has(userId) ? (probeCache.get(userId) ?? null) : null,
  );
  // Bumped by retry() to force the probe effect to re-run after a transient
  // failure (deliberately uncached, so a re-run actually re-probes).
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // No probe needed: logged out (handled by the return below) or already known
    // to be an admin via role.
    if (!userId || isRoleAdmin) return;

    if (probeCache.has(userId)) {
      setProbed(probeCache.get(userId) ?? null);
      return;
    }

    let cancelled = false;
    const ac = new AbortController();
    void probeAdmin(ac.signal).then((result) => {
      if (cancelled) return;
      if (result === 'admin') {
        probeCache.set(userId, true);
        setProbed(true);
      } else if (result === 'forbidden') {
        probeCache.set(userId, false);
        setProbed(false);
      } else {
        // Transient — do NOT cache; stay 'undecided' so retry() can resolve it
        // later instead of locking the user out.
        setProbed(null);
      }
    });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [userId, isRoleAdmin, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const isAdmin = isRoleAdmin ? true : !userId ? false : probed;
  return { isAdmin, retry };
}

export function useIsAdmin(): boolean | null {
  return useAdminGate().isAdmin;
}
