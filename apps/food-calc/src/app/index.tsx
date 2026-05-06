import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

import { Sentry } from '@/shared/lib/observability/sentry';
import { router } from '@/app/router.tsx';
import { SyncProvider } from '@/shared/lib/sync/SyncProvider';
import { installE2EBridge } from '@/shared/lib/e2e/bridge';
import { diagLog } from '@/shared/lib/observability/diagLog';
import { DesignVariantsBar, shouldShowDvBar } from '@/app/ui/DesignVariantsBar';

// Boot diagnostics — UA + AbortSignal.any/timeout availability + navigator.locks
// snapshots (boot, +5s, +15s) + storage.estimate + idb-keyval roundtrip probe.
// Help diagnose scheduler leader-election deadlocks (drainPush holds
// 'disher-drain' via navigator.locks.request) and iOS Safari IDB issues.
// Gated behind VITE_DIAG=1 so cold-start (incl. prod) stays clean by default;
// re-enable per-session when investigating an issue.
const DIAG_ENABLED = import.meta.env.VITE_DIAG === '1';

if (DIAG_ENABLED) {
  diagLog('[diag] env probe', {
    ua: navigator.userAgent,
    abortAny: typeof (AbortSignal as unknown as { any?: unknown }).any,
    abortTimeout: typeof (AbortSignal as unknown as { timeout?: unknown }).timeout,
    locksApi: typeof navigator.locks,
  });
  (async () => {
    try {
      if (navigator.locks?.query) {
        const snap = await navigator.locks.query();
        diagLog('[diag] locks.query@boot', {
          held: snap.held?.map((l) => ({ name: l.name, mode: l.mode, clientId: l.clientId })) ?? [],
          pending: snap.pending?.map((l) => ({ name: l.name, mode: l.mode })) ?? [],
        });
      }
    } catch (e) {
      diagLog('[diag] locks.query@boot THROW', { err: String(e) });
    }
  })();
  // Repeat lock snapshot at +5s and +15s so we catch deadlocks that form during
  // auth refresh / first background refetch.
  setTimeout(() => {
    navigator.locks
      ?.query?.()
      .then((snap) => {
        diagLog('[diag] locks.query@5s', {
          held: snap.held?.map((l) => ({ name: l.name, mode: l.mode, clientId: l.clientId })) ?? [],
          pending: snap.pending?.map((l) => ({ name: l.name, mode: l.mode })) ?? [],
        });
      })
      .catch(() => {});
  }, 5000);
  setTimeout(() => {
    navigator.locks
      ?.query?.()
      .then((snap) => {
        diagLog('[diag] locks.query@15s', {
          held: snap.held?.map((l) => ({ name: l.name, mode: l.mode, clientId: l.clientId })) ?? [],
          pending: snap.pending?.map((l) => ({ name: l.name, mode: l.mode })) ?? [],
        });
      })
      .catch(() => {});
  }, 15000);

  // Probe storage estimate
  navigator.storage
    ?.estimate?.()
    .then((est) => {
      diagLog('[boot] storage.estimate', est);
    })
    .catch(() => {});

  // Probe idb-keyval roundtrip on boot. If this hangs or fails on iOS Safari,
  // that pinpoints an idb storage problem before drafts try to hydrate.
  (async () => {
    const t0 = performance.now();
    diagLog('[boot] idb probe START');
    try {
      const { get, set, del } = await import('idb-keyval');
      const probeKey = '__foodcalc_probe__';
      const probeVal = 'probe-' + Date.now();
      await set(probeKey, probeVal);
      const read = await get(probeKey);
      await del(probeKey);
      diagLog('[boot] idb probe END', {
        dt_ms: Math.round(performance.now() - t0),
        ok: read === probeVal,
      });
    } catch (err) {
      diagLog('[boot] idb probe THROW', {
        dt_ms: Math.round(performance.now() - t0),
        err: String(err),
      });
    }
  })();
}

// Request persistent storage (prevents iOS Safari 7-day IDB eviction). Always
// runs — this has real side-effects, not just diagnostics.
navigator.storage
  ?.persist?.()
  .then((granted) => {
    if (DIAG_ENABLED) diagLog('[boot] storage.persist', { granted });
  })
  .catch((e) => {
    if (DIAG_ENABLED) diagLog('[boot] storage.persist failed', { err: String(e) });
  });

installE2EBridge();

const root = document.getElementById('root')!;
ReactDOM.createRoot(root).render(
  <Sentry.ErrorBoundary
    fallback={
      <div style={{ padding: 24 }}>Что-то пошло не так. Попробуйте перезагрузить страницу.</div>
    }
    showDialog={false}
  >
    <SyncProvider>
      {shouldShowDvBar() && <DesignVariantsBar />}
      <RouterProvider router={router} />
    </SyncProvider>
  </Sentry.ErrorBoundary>
);

// Reveal UI after first paint to prevent FOUC
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    root.classList.add('ready');
  });
});
