import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/router.tsx';
import { initSession } from '@/api/triplit/session';
import { SyncProvider } from '@/api/triplit/SyncProvider';

// Start session (non-blocking when local data exists), render immediately
initSession();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SyncProvider>
    <RouterProvider router={router} />
  </SyncProvider>,
);
