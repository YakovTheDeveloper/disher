import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

if (import.meta.env.DEV) {
  import('vconsole').then(({ default: VConsole }) => new VConsole());
}

import { Sentry } from '@/shared/lib/observability/sentry';
import { router } from '@/app/router.tsx';
import { SyncProvider } from '@/shared/lib/sync/SyncProvider';
import { AuthGate } from '@/features/auth';
import { installE2EBridge } from '@/shared/lib/e2e/bridge';
import { diagLog } from '@/shared/lib/observability/diagLog';
import { DiagButton } from '@/shared/lib/observability/DiagButton';

// Diagnostics for iOS Supabase REST hang (research 2026-04-28):
// #1 AbortSignal.any availability (iOS < 17.4 lacks it -> our wrapper drops timeoutSignal)
// #2 navigator.locks state (Supabase auth Web-Locks deadlock per supabase-js#2111/#1594)
// #3 UA so we can correlate with iOS version in the dump
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
  navigator.locks?.query?.().then((snap) => {
    diagLog('[diag] locks.query@5s', {
      held: snap.held?.map((l) => ({ name: l.name, mode: l.mode, clientId: l.clientId })) ?? [],
      pending: snap.pending?.map((l) => ({ name: l.name, mode: l.mode })) ?? [],
    });
  }).catch(() => {});
}, 5000);
setTimeout(() => {
  navigator.locks?.query?.().then((snap) => {
    diagLog('[diag] locks.query@15s', {
      held: snap.held?.map((l) => ({ name: l.name, mode: l.mode, clientId: l.clientId })) ?? [],
      pending: snap.pending?.map((l) => ({ name: l.name, mode: l.mode })) ?? [],
    });
  }).catch(() => {});
}, 15000);

// Request persistent storage (prevents iOS Safari 7-day IDB eviction)
navigator.storage?.persist?.().then((granted) => {
  diagLog('[boot] storage.persist', { granted });
}).catch((e) => diagLog('[boot] storage.persist failed', { err: String(e) }));

// Probe storage estimate
navigator.storage?.estimate?.().then((est) => {
  diagLog('[boot] storage.estimate', est);
}).catch(() => {});

// Probe idb-keyval roundtrip BEFORE persister starts. If this hangs or fails
// on iOS Safari, that pinpoints the persister hydration issue.
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
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
      {import.meta.env.DEV && <DiagButton />}
    </SyncProvider>
  </Sentry.ErrorBoundary>
);

// Reveal UI after first paint to prevent FOUC
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    root.classList.add('ready');
  });
});
