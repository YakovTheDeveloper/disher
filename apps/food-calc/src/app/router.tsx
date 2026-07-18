import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '@/app/App.tsx';
import HomePage from '@/pages/home-page/HomePage.tsx';
import { format } from 'date-fns';
import RouteError from '@/shared/ui/error/RouteError.tsx';
import { RouterLinks } from '@/shared/config/routes';

// Route-level code-splitting: secondary pages ship as their own chunk, pulled on
// navigation instead of riding the initial bundle. The <Suspense> boundary that
// covers these lazy elements lives around <Outlet/> in App.tsx. App / RouteError /
// HomePage stay eager — App is the always-mounted shell, RouteError is the
// errorElement that must exist the instant a page throws, and HomePage is the
// LANDING screen (every session redirects to /schedule/:today), so making it lazy
// only adds a second network round-trip + spinner before the first paint people
// actually wait on.
const DishBuilderPage = lazy(() => import('@/pages/dish/DishBuilderPage.tsx'));
const AnalysesPage = lazy(() => import('@/pages/analyses/AnalysesPage.tsx'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage.tsx'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage.tsx'));

// Standalone dev-«предложки» (/suggestion_<id>) — top-level sibling <App>, вне
// AuthGate. Автодискавери эфемерных папок s_*/ через glob; на чистом чекауте
// пусто. См. app/development-features/.
import { devRoute } from '@/app/development-features/devRoutes';

export const router = createBrowserRouter([
  {
    path: RouterLinks.Root,
    element: <App />,
    // A pathless layout route (renders an <Outlet/>) that carries the
    // errorElement. A throw from ANY page below lands here — INSIDE App's
    // <Outlet/> — so the app chrome (Toaster / Modal+Drawer managers / AuthGate)
    // stays mounted while only the failed page is replaced by RouteError. If the
    // errorElement were on the root route instead, App itself would be unmounted.
    children: [
      {
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            element: <Navigate to={`/schedule/${format(new Date(), 'dd-MM-yyyy')}`} replace />,
          },
          {
            path: `${RouterLinks.Dish}`,
            element: <DishBuilderPage />,
          },
          {
            path: RouterLinks.ScheduleBuilder + '/' + ':id',
            element: <HomePage />,
          },
          {
            path: RouterLinks.Analyses,
            element: <AnalysesPage />,
          },
          {
            // Client gate is UX only (AdminPage bounces non-admins) — the server
            // guards every /api/admin route, so an unguarded static route is safe.
            path: RouterLinks.Admin,
            element: <AdminPage />,
          },
          {
            path: RouterLinks.VerifyEmail,
            element: <VerifyEmailPage />,
          },
        ],
      },
    ],
  },
  devRoute,
]);
