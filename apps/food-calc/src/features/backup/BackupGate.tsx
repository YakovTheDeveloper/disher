import { useEffect, useState, type ReactNode } from 'react';
import { db } from '@/shared/lib/dexie/schema';
import { isSyncEnabled } from '@/shared/lib/sync-pref';
import { runSyncTracked } from '@/shared/lib/sync/runSync';

// On mount, reconcile with the vault via syncNow() (pull → merge → push) under
// the 'disher-sync' lock. merge() handles both first-launch adoption (empty
// local) and returning-device LWW + tombstone reconciliation, so no push-or-
// pull branch is needed. We still gate rendering on local row count: a device
// that already has data renders immediately and syncs in the background; a
// fresh device blocks until the pull+merge lands so the UI hydrates. Offline-
// tolerant. AuthGate sign-out → unmount, so the gate fires fresh on next sign-in.
//
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md §Boot.
export function BackupGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Sync turned off (consent withdrawn) — never pull/merge/push. Render
        // immediately from local Dexie; data stays on-device. (Default is ON, so
        // existing users keep today's behaviour.)
        if (!isSyncEnabled()) return;
        const counts = await Promise.all(db.tables.map((t) => t.count()));
        if (counts.some((c) => c > 0)) {
          // Local data present — render now, reconcile in the background.
          // runSyncTracked records the outcome in the sync-status store and,
          // when online, surfaces a retry-able toaster (dyra #1: a silently
          // dropped push used to leave the user believing their data was safe
          // in the cloud). It never throws, so boot is unaffected.
          void runSyncTracked();
        } else {
          // First launch on this device — block until the vault is pulled and
          // merged so the UI renders with the user's data. Still tracked: an
          // online failure toasts; an offline first-launch renders fresh.
          await runSyncTracked();
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
