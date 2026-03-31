import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/router.tsx';
import { LiveStoreSetup } from '@/livestore/LiveStoreSetup';
import { SeedGate } from '@/livestore/SeedGate';
import { getCurrentUserId } from '@/shared/lib/user';

// Request persistent storage (prevents iOS Safari 7-day IDB eviction)
navigator.storage?.persist?.();

const storeId = `user-${getCurrentUserId()}`;

const root = document.getElementById('root')!;
ReactDOM.createRoot(root).render(
  <LiveStoreSetup storeId={storeId}>
    <SeedGate>
      <RouterProvider router={router} />
    </SeedGate>
  </LiveStoreSetup>,
);

// Reveal UI after first paint to prevent FOUC
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    root.classList.add('ready');
  });
});
