import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/router.tsx';
import { initSession } from '@/api/triplit/session';
import { SyncProvider } from '@/api/triplit/SyncProvider';

// Start session (non-blocking when local data exists), render immediately
initSession();

const root = document.getElementById('root')!;
ReactDOM.createRoot(root).render(
  <SyncProvider>
    <RouterProvider router={router} />
  </SyncProvider>,
);

// Reveal UI after first paint to prevent FOUC
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    root.classList.add('ready');
  });
});
