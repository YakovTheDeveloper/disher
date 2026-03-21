import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '@/app/App.tsx';
import HomePage from '@/pages/home-page/HomePage.tsx';
import { format } from 'date-fns';
import ScheduleDateSelectionPage from '@/pages/schedule/schedule-date-selection-page/ScheduleDateSelectionPage.tsx';
import DishBuilderPage from '@/pages/dish/DishBuilderPage.tsx';

import FoodPage from '@/pages/food/FoodPage.tsx';
import ProductPage from '@/pages/product/ProductPage.tsx';
import DailyNormPage from '@/pages/daily-norms/DailyNormPage/DailyNormPage.tsx';
import { ScheduleFoodAnalyticsPage } from '@/pages/schedule/analytics/schedule-analytics-page/ScheduleFoodAnalyticsPage/index.ts';
import SettingsPage from '@/pages/settings/SettingsPage/SettingsPage.tsx';
import SystemPage from '@/pages/settings/SystemPage/SystemPage.tsx';

export enum RouterLinks {
  Root = '/',
  DailyNorms = '/daily-norms',
  Food = '/food',
  DishBuilder = '/dish',

  Dish = '/dish/:id',
  ScheduleDateSelection = '/date',
  ScheduleBuilder = '/schedule',
  ScheduleAnalytics = `/schedule/:id/analytics`,
  Product = '/product',
  Settings = '/settings',
  System = '/system',
}

export const getScheduleAnalyticsUrl = (id: string) => `/schedule/${id}/analytics`;

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
        path: `${RouterLinks.DailyNorms}/:id`,
        element: <DailyNormPage />,
      },
      {
        path: `${RouterLinks.Dish}`,
        element: <DishBuilderPage />,
      },
      {
        path: RouterLinks.ScheduleDateSelection,
        element: <ScheduleDateSelectionPage />,
      },
      {
        path: RouterLinks.ScheduleBuilder + '/' + ':id',
        element: <HomePage />,
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
        path: RouterLinks.Food,
        element: <FoodPage />,
      },
      {
        path: RouterLinks.Settings,
        element: <SettingsPage />,
      },
      {
        path: RouterLinks.System,
        element: <SystemPage />,
      },
    ],
  },
]);
