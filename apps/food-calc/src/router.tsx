import { createBrowserRouter } from 'react-router-dom';
import DailyNorms from '@/components/features/DailyNorms/DailyNorms.tsx';
import App from '@/App.tsx';
import ScheduleBuilderPage from './pages/schedule/builder/schedule-builder-page/ScheduleBuilderPage.tsx';
import SchedulePage from '@/pages/schedule/schedule-page/SchedulePage.tsx';
import DishBuilderPage from '@/pages/dish/builder/dish-builder-page/DishBuilderPage.tsx';
import { DailyNormsPage } from '@/pages/dailyNormsPage/index.ts';
import ProductBuilderPage from '@/pages/productBuilderPage/productBuilderPage.tsx';
import LoadDataPage from '@/pages/LoadDataPage/LoadDataPage.tsx';

export enum RouterLinks {
  Root = '/',
  DailyNorms = '/daily-norms',
  DishBuilder = '/dish/builder',
  Schedule = '/schedule',
  ScheduleBuilder = '/schedule/builder/',
  ProductBuilder = '/product/builder/',
  LoadData = '/load-data/',
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
        path: RouterLinks.DailyNorms,
        element: <DailyNorms />,
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
        path: RouterLinks.ScheduleBuilder + ':date',
        element: <ScheduleBuilderPage />,
      },
      {
        path: RouterLinks.ProductBuilder,
        element: <ProductBuilderPage />,
      },
      {
        path: RouterLinks.LoadData,
        element: <LoadDataPage />,
      },
    ],
  },
]);
