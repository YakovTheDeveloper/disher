import { createBrowserRouter } from 'react-router-dom';
import DailyNorms from '@/components/features/DailyNorms/DailyNorms.tsx';
import App from '@/App.tsx';
import ScheduleBuilderPage from './pages/schedule/builder/schedule-builder-page/ScheduleBuilderPage.tsx';
import SchedulePage from '@/pages/schedule/schedule-page/SchedulePage.tsx';
import DishBuilderPage from '@/pages/dish/builder/dish-builder-page/DishBuilderPage.tsx';
import { DailyNormsPage } from '@/pages/daily-norms/dailyNormsPage/index.ts';

import LoadDataPage from '@/pages/LoadDataPage/LoadDataPage.tsx';
import DishesPage from '@/pages/dish/dishes-page/DishesPage.tsx';
import UserProductPage from '@/pages/user-product-page/UserProductPage.tsx';
import DailyNormsCreateOrUpdatePage from '@/pages/daily-norms/DailyNormsCreateOrUpdatePage/DailyNormsCreateOrUpdatePage.tsx';
import TestModalPage from '@/pages/swipe-test/TestModalPage';

export enum RouterLinks {
  Root = '/',
  DailyNorms = '/daily-norms',
  DishBuilder = '/dish',
  Schedule = '/date',
  ScheduleBuilder = '/schedule',
  ProductBuilder = '/product',
  LoadData = '/load-data',
  Dishes = '/dishes',
  UserProduct = '/user-product',
  Test2 = '/test-2',
  // DailyNormsCreateOrUpdate = '/daily-norms',
}

export const router = createBrowserRouter([
  {
    path: RouterLinks.Root,
    element: <App />,
    children: [
      {
        path: RouterLinks.DailyNorms,
        element: <DailyNormsPage />,
      },
      {
        path: `${RouterLinks.DailyNorms}/:id`,
        element: <DailyNormsCreateOrUpdatePage />,
      },
      {
        path: `${RouterLinks.DishBuilder}/:id`,
        element: <DishBuilderPage />,
      },
      {
        path: `${RouterLinks.DishBuilder}`,
        element: <DishBuilderPage />,
      },
      {
        path: RouterLinks.Schedule,
        element: <SchedulePage />,
      },
      {
        path: RouterLinks.ScheduleBuilder + '/' + ':date',
        element: <ScheduleBuilderPage />,
      },
      // {
      //   path: RouterLinks.ProductBuilder,
      //   element: <ProductBuilderPage />,
      // },
      {
        path: RouterLinks.LoadData,
        element: <LoadDataPage />,
      },
      {
        path: RouterLinks.Dishes,
        element: <DishesPage />,
      },
      {
        path: `${RouterLinks.UserProduct}/:id`,
        element: <UserProductPage />,
      },
      {
        path: RouterLinks.Test2,
        element: <TestModalPage />,
      },
    ],
  },
]);
