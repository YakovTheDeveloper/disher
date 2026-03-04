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
import ScheduleFoodPage from './pages/schedule/builder/schedule-food-page/ScheduleFoodPage.tsx';
import ScheduleEventPage from '@/pages/schedule/builder/schedule-event-page/ScheduleEventPage.tsx';
import DishFoodPage from '@/pages/dish/DishFoodPage/DishFoodPage.tsx';
import DishFoodDraftPage from '@/pages/dish/DishFoodPage/DishFoodDraftPage.tsx';
import ProductListPage from '@/pages/product/ProductListPage/ProductListPage.tsx';

export enum RouterLinks {
  Root = '/',
  DailyNorms = '/daily-norms',
  Products = '/products',
  DishBuilder = '/dish',

  Dish = '/dish/:id',
  DishFoodDraft = '/dish/:id/food/draft',
  DishFood = '/dish/:id/food/:childId',
  Schedule = '/date',
  ScheduleBuilder = '/schedule',
  ScheduleFood = `/schedule/:id/food/:childId`,
  ScheduleEvent = `/schedule/:id/event/:childId`,
  ProductBuilder = '/product',
  LoadData = '/load-data',
  Dishes = '/dishes',
  UserProduct = '/user-product',
  Test2 = '/test-2',
  // DailyNormsCreateOrUpdate = '/daily-norms',
}

export const getScheduleFoodUrl = (id: string, childId: string) =>
  `/schedule/${id}/food/${childId}`;

export const getScheduleEventUrl = (id: string, childId: string) =>
  `/schedule/${id}/event/${childId}`;

export const getDishFoodDraftUrl = (id: string) => `/dish/${id}/food/draft`;

export const getDishFoodUrl = (id: string) => `/dish/${id}/food/:childId`;

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
        path: RouterLinks.DailyNorms,
        element: <DailyNormsPage />,
      },
      {
        path: `${RouterLinks.DailyNorms}/:id`,
        element: <DailyNormPage />,
      },
      {
        path: `${RouterLinks.Dish}`,
        element: <DishBuilderPage />,
      },
      {
        path: `${RouterLinks.DishFood}`,
        element: <DishFoodPage />,
      },
      {
        path: `${RouterLinks.DishFoodDraft}`,
        element: <DishFoodDraftPage />,
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
        path: RouterLinks.Products,
        element: <ProductListPage />,
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
        path: `${RouterLinks.ScheduleFood}/`,
        element: <ScheduleFoodPage />,
      },
      {
        path: `${RouterLinks.ScheduleEvent}`,
        element: <ScheduleEventPage />,
      },
    ],
  },
]);
