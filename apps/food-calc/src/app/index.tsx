import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/router.tsx';
import { LiveStoreSetup } from '@/livestore/LiveStoreSetup';
import { getCurrentUserId } from '@/api/triplit/session';

// Request persistent storage (prevents iOS Safari 7-day IDB eviction)
navigator.storage?.persist?.();

const storeId = `user-${getCurrentUserId()}`;

const root = document.getElementById('root')!;
ReactDOM.createRoot(root).render(
  <LiveStoreSetup storeId={storeId}>
    <RouterProvider router={router} />
  </LiveStoreSetup>,
);

// Reveal UI after first paint to prevent FOUC
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    root.classList.add('ready');
  });
});
