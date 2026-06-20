import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '@/app/App.tsx';
import HomePage from '@/pages/home-page/HomePage.tsx';
import { format } from 'date-fns';
import DishBuilderPage from '@/pages/dish/DishBuilderPage.tsx';

// ProductPage инактивирована (2026-06-08): продукт теперь открывается боковым
// ProductDrawer (features/food/product-drawer) везде, где раньше был переход на
// /product/:id. Файл оставлен для возможного возврата; роут ниже закомментирован.
// import ProductPage from '@/pages/product/ProductPage.tsx';
import AnalysesPage from '@/pages/analyses/AnalysesPage.tsx';
import { DiscoveriesPage } from '@/pages/discoveries';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage.tsx';

// Standalone dev-«предложки» (/suggestion_<id>) — top-level sibling <App>, вне
// AuthGate. Автодискавери эфемерных папок s_*/ через glob; на чистом чекауте
// пусто. См. app/development-features/.
import { devRoute } from '@/app/development-features/devRoutes';

// Dev-only component gallery — lazy so its (app-wide) widget/drawer imports stay
// out of the main bundle. The only lazy route, so it carries its own Suspense.
const UiKitPage = lazy(() => import('@/pages/ui-kit/UiKitPage.tsx'));

export enum RouterLinks {
  Root = '/',
  Food = '/food',
  DishBuilder = '/dish',

  Dish = '/dish/:id',
  ScheduleBuilder = '/schedule',
  Analyses = '/analyses',
  Discoveries = '/discoveries',
  Product = '/product',
  UiKit = '/ui-kit',
  VerifyEmail = '/auth/verify-email',
}

export const getProductUrl = (id: string) => `/product/${id}`;

export const RouterUrls = {
  Schedule: (id: string) => `/schedule/${id}`,
  getDish: (id: string) => `/dish/${id}`,
  getDishDraft: () => `/dish/draft`,
};

export const router = createBrowserRouter([
  {
    path: RouterLinks.Root,
    element: <App />,
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
        path: RouterLinks.Discoveries,
        element: <DiscoveriesPage />,
      },
      // Инактивировано 2026-06-08 — продукт открывается боковым ProductDrawer,
      // не страницей. Раскомментировать вместе с импортом ProductPage выше.
      // {
      //   path: `${RouterLinks.Product}/:id`,
      //   element: <ProductPage />,
      // },
      {
        path: RouterLinks.UiKit,
        element: (
          <Suspense fallback={null}>
            <UiKitPage />
          </Suspense>
        ),
      },
      {
        path: RouterLinks.VerifyEmail,
        element: <VerifyEmailPage />,
      },
    ],
  },
  devRoute,
]);
