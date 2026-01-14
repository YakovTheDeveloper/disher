import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';

import DishIcon from '@/assets/icons/dish.svg';
import DaysIcon from '@/assets/icons/days.svg';
import Modal from 'react-modal';
import { router } from '@/router.tsx';

// import { registerSW } from 'virtual:pwa-register';

// registerSW({
//   onNeedRefresh() {
//     console.log('Доступно обновление');
//   },
//   onOfflineReady() {
//     console.log('Приложение готово для офлайн');
//   },
// });

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

Modal.setAppElement('#modal-root');

ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
