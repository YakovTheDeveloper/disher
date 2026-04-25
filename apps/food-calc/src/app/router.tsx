import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '@/app/App.tsx';
import HomePage from '@/pages/home-page/HomePage.tsx';
import { format } from 'date-fns';
import ScheduleDateSelectionPage from '@/pages/schedule/schedule-date-selection-page/ScheduleDateSelectionPage.tsx';
import DishBuilderPage from '@/pages/dish/DishBuilderPage.tsx';
import FreeTextFoodPage from '@/pages/free-text-food/FreeTextFoodPage.tsx';
import FreeTextFoodDishPage from '@/pages/free-text-food/FreeTextFoodDishPage.tsx';

import ProductPage from '@/pages/product/ProductPage.tsx';
import { ScheduleFoodAnalyticsPage } from '@/pages/schedule/analytics/schedule-analytics-page/ScheduleFoodAnalyticsPage/index.ts';
import SettingsPage from '@/pages/settings/SettingsPage/SettingsPage.tsx';
import SystemPage from '@/pages/settings/SystemPage/SystemPage.tsx';
import NutrientArticlesPage from '@/pages/articles/NutrientArticlesPage.tsx';
import NutrientArticlePage from '@/pages/articles/NutrientArticlePage.tsx';
import ShareReceivePage from '@/pages/share/ShareReceivePage.tsx';

export enum RouterLinks {
  Root = '/',
  Food = '/food',
  DishBuilder = '/dish',

  Dish = '/dish/:id',
  ScheduleDateSelection = '/date',
  ScheduleBuilder = '/schedule',
  ScheduleAnalytics = `/schedule/:id/analytics`,
  FreeTextFoodSchedule = '/free-text-food/schedule/:date',
  FreeTextFoodDish = '/free-text-food/dish/:dishId',
  Product = '/product',
  Settings = '/settings',
  System = '/system',
  NutrientArticles = '/articles/nutrients',
  NutrientArticle = '/articles/nutrients/:folder',
  Share = '/share',
}

export const getScheduleAnalyticsUrl = (id: string) => `/schedule/${id}/analytics`;

export const getProductUrl = (id: string) => `/product/${id}`;
export const getNutrientArticleUrl = (folder: string) => `/articles/nutrients/${folder}`;

export const getFreeTextFoodUrl = (date: string) => `/free-text-food/schedule/${date}`;
export const getFreeTextFoodDishUrl = (dishId: string) => `/free-text-food/dish/${dishId}`;

export const RouterUrls = {
  Schedule: (id: string) => `/schedule/${id}`,
  getDish: (id: string) => `/dish/${id}`,
  getDishDraft: () => `/dish/draft`,
  FreeTextFoodSchedule: (date: string) => `/free-text-food/schedule/${date}`,
  FreeTextFoodDish: (dishId: string) => `/free-text-food/dish/${dishId}`,
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
        path: RouterLinks.FreeTextFoodSchedule,
        element: <FreeTextFoodPage />,
      },
      {
        path: RouterLinks.FreeTextFoodDish,
        element: <FreeTextFoodDishPage />,
      },
      {
        path: `${RouterLinks.Product}/:id`,
        element: <ProductPage />,
      },
      {
        path: RouterLinks.Settings,
        element: <SettingsPage />,
      },
      {
        path: RouterLinks.System,
        element: <SystemPage />,
      },
      {
        path: RouterLinks.NutrientArticles,
        element: <NutrientArticlesPage />,
      },
      {
        path: RouterLinks.NutrientArticle,
        element: <NutrientArticlePage />,
      },
      {
        path: RouterLinks.Share,
        element: <ShareReceivePage />,
      },
    ],
  },
]);
