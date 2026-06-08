// Side-effect: registers the Navigation API `navigate` listener (or popstate
// fallback) BEFORE createBrowserRouter installs its own listeners. See
// apps/food-calc/tds/overlay-navigation-api-migration.md.
import '@/shared/lib/overlay-history';

import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

import { Sentry } from '@/shared/lib/observability/sentry';
import { router } from '@/app/router.tsx';
import { useAuthStore } from '@/features/auth/auth-store';
import { installE2EBridge } from '@/shared/lib/e2e/bridge';
import { installViewTransitionCleanup } from '@/shared/lib/viewTransition';
import { diagLog } from '@/shared/lib/observability/diagLog';
import { DesignVariantsBar, shouldShowDvBar } from '@/app/ui/DesignVariantsBar';

// Boot diagnostics — UA + AbortSignal.any/timeout + storage.estimate +
// idb-keyval roundtrip probe. Gated behind VITE_DIAG=1 so cold-start (incl.
// prod) stays clean by default.
const DIAG_ENABLED = import.meta.env.VITE_DIAG === '1';

if (DIAG_ENABLED) {
  diagLog('[diag] env probe', {
    ua: navigator.userAgent,
    abortAny: typeof (AbortSignal as unknown as { any?: unknown }).any,
    abortTimeout: typeof (AbortSignal as unknown as { timeout?: unknown }).timeout,
  });

  navigator.storage
    ?.estimate?.()
    .then((est) => {
      diagLog('[boot] storage.estimate', est);
    })
    .catch(() => {});

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

// Wrap document.startViewTransition once so `data-vt-type` (the storyboard
// selector set right before each VT navigation) is cleared on every
// transition.finished — covers both hook and imperative (pushNavigate) sites.
installViewTransitionCleanup();

// Resolve the initial session. AuthGate flips to `isReady` and either renders
// AuthScreen or BackupGate→app accordingly.
void useAuthStore.getState().bootstrap();

const root = document.getElementById('root')!;
ReactDOM.createRoot(root).render(
  <Sentry.ErrorBoundary
    fallback={
      <div style={{ padding: 24 }}>Что-то пошло не так. Попробуйте перезагрузить страницу.</div>
    }
    showDialog={false}
  >
    {shouldShowDvBar() && <DesignVariantsBar />}
    <RouterProvider router={router} />
  </Sentry.ErrorBoundary>
);

// Reveal UI after first paint to prevent FOUC
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    root.classList.add('ready');
  });
});
