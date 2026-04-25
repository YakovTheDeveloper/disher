import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

// if (import.meta.env.DEV) {
//   import('vconsole').then(({ default: VConsole }) => new VConsole());
// }

import { router } from '@/app/router.tsx';
import { PowerSyncProvider } from '@/powersync/PowerSyncProvider';

// Request persistent storage (prevents iOS Safari 7-day IDB eviction)
navigator.storage?.persist?.();

const root = document.getElementById('root')!;
ReactDOM.createRoot(root).render(
  <PowerSyncProvider>
    <RouterProvider router={router} />
  </PowerSyncProvider>
);

// Reveal UI after first paint to prevent FOUC
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    root.classList.add('ready');
  });
});
