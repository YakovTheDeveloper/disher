import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

// if (import.meta.env.DEV) {
//   import('vconsole').then(({ default: VConsole }) => new VConsole());
// }

import { Sentry } from '@/shared/lib/observability/sentry';
import { router } from '@/app/router.tsx';
import { SyncProvider } from '@/shared/lib/sync/SyncProvider';
import { AuthGate } from '@/features/auth';
import { installE2EBridge } from '@/shared/lib/e2e/bridge';

// Request persistent storage (prevents iOS Safari 7-day IDB eviction)
navigator.storage?.persist?.();

installE2EBridge();

const root = document.getElementById('root')!;
ReactDOM.createRoot(root).render(
  <Sentry.ErrorBoundary
    fallback={
      <div style={{ padding: 24 }}>
        Что-то пошло не так. Попробуйте перезагрузить страницу.
      </div>
    }
    showDialog={false}
  >
    <SyncProvider>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </SyncProvider>
  </Sentry.ErrorBoundary>
);

// Reveal UI after first paint to prevent FOUC
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    root.classList.add('ready');
  });
});
