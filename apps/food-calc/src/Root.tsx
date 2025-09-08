import NotificationWrapper from '@/components/ui/Notification/NotificationWrapper';
import ModalRoot from '@/ModalRoot';
import { Outlet } from 'react-router';
import s from './Root.module.css';

import { useEffect } from 'react';

const Root = () => {
  useEffect(() => {
    // fetchGetProducts().then((res) => {
    //     if (res.isError) return
    //     productStore.setProductsBase(res.data)
    // });
    // Flows.Dish.getAll()
  }, []);

  return (
    <div className={s.root}>
      {/* <Header /> */}
      <ModalRoot />
      <NotificationWrapper />
      <div className={s.main}>
        <Outlet />
      </div>
    </div>
  );
};

export default Root;
