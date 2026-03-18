import { createBrowserRouter } from 'react-router-dom';
import App from '@/App.tsx';
import ScheduleBuilderPage from './pages/schedule/builder/schedule-builder-page/ScheduleBuilderPage.tsx';
import SchedulePage from '@/pages/schedule/schedule-page/SchedulePage.tsx';
import DishBuilderPage from '@/pages/dish/builder/dish-builder-page/DishBuilderPage.tsx';
import { DailyNormsPage } from '@/pages/daily-norms/dailyNormsPage/index.ts';

import LoadDataPage from '@/pages/LoadDataPage/LoadDataPage.tsx';
import FoodPage from '@/pages/food/FoodPage.tsx';
import UserProductPage from '@/pages/user-product-page/UserProductPage.tsx';
import ProductPage from '@/pages/product-page/ProductPage.tsx';
import DailyNormPage from '@/pages/daily-norms/DailyNormPage/DailyNormPage.tsx';
import DishFoodPage from '@/pages/dish/DishFoodPage/DishFoodPage.tsx';
import DishFoodDraftPage from '@/pages/dish/DishFoodPage/DishFoodDraftPage.tsx';
import { ScheduleFoodAnalyticsPage } from '@/pages/schedule/analytics/schedule-analytics-page/ScheduleFoodAnalyticsPage/index.ts';
import SettingsPage from '@/pages/settings/SettingsPage/SettingsPage.tsx';
import ResetPage from '@/pages/settings/ResetPage/ResetPage.tsx';

export enum RouterLinks {
  Root = '/',
  DailyNorms = '/daily-norms',
  Food = '/food',
  DishBuilder = '/dish',

  Dish = '/dish/:id',
  DishFoodDraft = '/dish/:id/food/draft',
  DishFood = '/dish/:id/food/:childId',
  ScheduleDateSelection = '/date',
  ScheduleBuilder = '/schedule',
  ScheduleAnalytics = `/schedule/:id/analytics`,
  Product = '/product',
  LoadData = '/load-data',
  UserProduct = '/user-product',
  // DailyNormsCreateOrUpdate = '/daily-norms',
  Settings = '/settings',
  Reset = '/reset',
}

export const getScheduleAnalyticsUrl = (id: string) => `/schedule/${id}/analytics`;

export const getDishFoodDraftUrl = (id: string) => `/dish/${id}/food/draft`;
export const getProductUrl = (id: string) => `/product/${id}`;

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
        path: RouterLinks.ScheduleDateSelection,
        element: <SchedulePage />,
      },
      {
        path: RouterLinks.ScheduleBuilder + '/' + ':id',
        element: <ScheduleBuilderPage />,
      },
      {
        path: RouterLinks.ScheduleAnalytics,
        element: <ScheduleFoodAnalyticsPage />,
      },
      {
        path: `${RouterLinks.Product}/:id`,
        element: <ProductPage />,
      },
      {
        path: RouterLinks.LoadData,
        element: <LoadDataPage />,
      },
      {
        path: RouterLinks.Food,
        element: <FoodPage />,
      },
      {
        path: `${RouterLinks.UserProduct}/:id`,
        element: <UserProductPage />,
      },
      {
        path: RouterLinks.Settings,
        element: <SettingsPage />,
      },
      {
        path: RouterLinks.Reset,
        element: <ResetPage />,
      },
    ],
  },
]);
