import NotificationWrapper from '@/components/ui/Notification/NotificationWrapper';
import { Outlet } from 'react-router-dom';
import s from '@/assets/style/Root.module.scss';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/assets/style/index.css';
import '@/assets/style/App.module.scss';
import { domainStore } from '@/store/store';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

const App = () => {
  const store = domainStore;

  console.log('store', store);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <div className={s.root}>
        <NotificationWrapper />
        <div className={s.main}>
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default App;
