import { useEffect, useState, type ReactNode } from 'react';
import { db } from '@/shared/lib/dexie/schema';
import { apply, pull, push } from '@/shared/lib/snapshot';

// One push per mount when local Dexie has rows; otherwise one pull. Multi-
// session days produce multi-push, harmless because the backend upsert is
// LWW. Push is fire-and-forget; pull is in a try/catch so first-launch on a
// new device renders even when offline. AuthGate sign-out → unmount, so the
// gate fires fresh on next sign-in.
//
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md §Boot.
export function BackupGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const counts = await Promise.all(db.tables.map((t) => t.count()));
        if (counts.some((c) => c > 0)) {
          push().catch(() => {
            /* offline; next mount tries again */
          });
        } else {
          try {
            const snap = await pull();
            if (snap && !cancelled) await apply(snap);
          } catch {
            /* offline first-launch; render fresh */
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready ? <>{children}</> : null;
}
