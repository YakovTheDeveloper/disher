import { createBrowserRouter } from 'react-router';
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

export const router = createBrowserRouter([
  {
    path: '/',

    element: <Root />,

    children: [
      {
        path: '',

        element: <Dishes />,
      },
      {
        path: '/add_product',

        element: <ProductAdd />,
      },
      {
        path: '/add_product',

        element: <ProductAdd />,
      },
      {
        path: '/days',

        element: <Days />,
      },

      {
        path: '/daily-norms',

        element: <DailyNorms />,
      },

      {
        path: '/calendar',

        element: <DaysCalendar />,
      },
      {
        path: '/products',
        element: <ProductsPage />,
      },
      {
        path: '/dish/builder',
        element: <DishBuilderPage />,
      },
      {
        path: '/dish/builder/new',
        element: <NewDishBuilderPage />,
      },
      {
        path: '/schedule',
        element: <SchedulePage />,
      },
      {
        path: '/schedule/builder/',
        element: <ScheduleBuilderPage />,
      },
      {
        path: '/schedule/builder/new',
        element: <NewScheduleBuilderPage />,
      },
    ],
  },
]);
