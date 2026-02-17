import { createBrowserRouter } from 'react-router-dom';
import App from '@/App.tsx';
import ScheduleBuilderPage from './pages/schedule/builder/schedule-builder-page/ScheduleBuilderPage.tsx';
import SchedulePage from '@/pages/schedule/schedule-page/SchedulePage.tsx';
import DishBuilderPage from '@/pages/dish/builder/dish-builder-page/DishBuilderPage.tsx';
import { DailyNormsPage } from '@/pages/daily-norms/dailyNormsPage/index.ts';

import LoadDataPage from '@/pages/LoadDataPage/LoadDataPage.tsx';
import DishesPage from '@/pages/dish/dishes-page/DishesPage.tsx';
import UserProductPage from '@/pages/user-product-page/UserProductPage.tsx';
import DailyNormPage from '@/pages/daily-norms/DailyNormPage/DailyNormPage.tsx';
import TestModalPage from '@/pages/swipe-test/TestModalPage';
import ScheduleFoodAddV2Page from './pages/schedule/builder/schedule-food-add-v2-page/ScheduleFoodAddV2Page.tsx';

export enum RouterLinks {
  Root = '/',
  DailyNorms = '/daily-norms',
  DishBuilder = '/dish',
  Schedule = '/date',
  ScheduleBuilder = '/schedule',
  ScheduleFoodAdd = '/schedule/food-add',
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
        element: <DailyNormPage />,
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
        path: RouterLinks.ScheduleBuilder + '/' + ':id',
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
      {
        path: `${RouterLinks.ScheduleFoodAdd}/:id`,
        element: <ScheduleFoodAddV2Page />,
      },
    ],
  },
]);
