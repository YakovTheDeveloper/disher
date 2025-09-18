import { createBrowserRouter } from 'react-router-dom';
import DailyNorms from '@/components/blocks/DailyNorms/DailyNorms.tsx';
import DaysCalendar from '@/components/blocks/DaysCalendar/DaysCalendar.tsx';
import Root from '@/Root.tsx';
import Dishes from '@/components/blocks/Dish/Dishes.tsx';
import ProductsPage from '@/components/blocks/Products/ProductsPage.tsx';
import ScheduleBuilderPage from './pages/schedule/builder/schedule-builder-page/ScheduleBuilderPage.tsx';
import SchedulePage from '@/pages/schedule/schedule-page/SchedulePage.tsx';
import NewScheduleBuilderPage from '@/pages/schedule/builder/new-schedule-builder-page/NewScheduleBuilderPage.tsx';
import DishBuilderPage from '@/pages/dish/builder/dish-builder-page/DishBuilderPage.tsx';
import NewDishBuilderPage from '@/pages/dish/builder/new-dish-builder-page/NewDishBuilderPage.tsx';
import Days from '@/components/blocks/Days/Days.tsx';
import ProductAdd from '@/components/blocks/ProductAdd/ProductAdd.tsx';

export enum RouterLinks {
  Root = '/',
  Dishes = '',
  AddProduct = '/add_product',
  Days = '/days',
  DailyNorms = '/daily-norms',
  Calendar = '/calendar',
  Products = '/products',
  DishBuilder = '/dish/builder',
  NewDishBuilder = '/dish/builder/new',
  Schedule = '/schedule',
  ScheduleBuilder = '/schedule/builder/',
  NewScheduleBuilder = '/schedule/builder/new',
}

export const router = createBrowserRouter([
  {
    path: RouterLinks.Root,
    element: <Root />,
    children: [
      {
        path: RouterLinks.Dishes,
        element: <Dishes />,
      },
      {
        path: RouterLinks.AddProduct,
        element: <ProductAdd />,
      },
      {
        path: RouterLinks.AddProduct,
        element: <ProductAdd />,
      },
      {
        path: RouterLinks.Days,
        element: <Days />,
      },
      {
        path: RouterLinks.DailyNorms,
        element: <DailyNorms />,
      },
      {
        path: RouterLinks.Calendar,
        element: <DaysCalendar />,
      },
      {
        path: RouterLinks.Products,
        element: <ProductsPage />,
      },
      {
        path: RouterLinks.DishBuilder,
        element: <DishBuilderPage />,
      },
      {
        path: RouterLinks.NewDishBuilder,
        element: <NewDishBuilderPage />,
      },
      {
        path: RouterLinks.Schedule,
        element: <SchedulePage />,
      },
      {
        path: RouterLinks.ScheduleBuilder,
        element: <ScheduleBuilderPage />,
      },
      {
        path: RouterLinks.NewScheduleBuilder,
        element: <NewScheduleBuilderPage />,
      },
    ],
  },
]);
