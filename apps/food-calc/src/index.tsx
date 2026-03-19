import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

import { router } from '@/router.tsx';
import { initSession } from '@/api/triplit/session';

// Pull __system__ data (anon) or restore authenticated session, then render
initSession().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
});
