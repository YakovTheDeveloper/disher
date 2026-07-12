import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '@/app/App.tsx';
import HomePage from '@/pages/home-page/HomePage.tsx';
import { format } from 'date-fns';
import DishBuilderPage from '@/pages/dish/DishBuilderPage.tsx';
import AnalysesPage from '@/pages/analyses/AnalysesPage.tsx';
import AdminPage from '@/pages/admin/AdminPage.tsx';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage.tsx';
import RouteError from '@/shared/ui/error/RouteError.tsx';

// Standalone dev-«предложки» (/suggestion_<id>) — top-level sibling <App>, вне
// AuthGate. Автодискавери эфемерных папок s_*/ через glob; на чистом чекауте
// пусто. См. app/development-features/.
import { devRoute } from '@/app/development-features/devRoutes';

export enum RouterLinks {
  Root = '/',
  Food = '/food',
  DishBuilder = '/dish',

  Dish = '/dish/:id',
  ScheduleBuilder = '/schedule',
  Analyses = '/analyses',
  Admin = '/admin',
  VerifyEmail = '/auth/verify-email',
}

export const RouterUrls = {
  Schedule: (id: string) => `/schedule/${id}`,
  getDish: (id: string) => `/dish/${id}`,
  getDishDraft: () => `/dish/draft`,
};

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
