import NotificationWrapper from '@/components/ui/Notification/NotificationWrapper';
import ModalRoot from '@/ModalRoot';
import { Outlet } from 'react-router';
import s from './Root.module.scss';

const Root = () => {
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
