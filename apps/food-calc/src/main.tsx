import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

import './index.css';

import DishIcon from '@/assets/icons/dish.svg';
import DaysIcon from '@/assets/icons/days.svg';

import { router } from '@/router.tsx';

export const RouterPaths = {
  main: {
    url: '/',
    label: 'Блюда',
    Icon: DishIcon,
  },
  days: {
    url: '/days',
    label: 'Дни',
    Icon: DaysIcon,
  },
  norm: {
    url: '/daily-norms',
    label: 'Нормы',
    Icon: DishIcon,
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
