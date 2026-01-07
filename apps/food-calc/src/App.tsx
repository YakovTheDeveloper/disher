import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import s from '@/assets/style/App.module.scss';
import '@/assets/style/index.scss';
import '@/assets/style/App.module.scss';
import { domainStore } from '@/store/store';
import { Toaster } from 'react-hot-toast';
import { setupGlobalLog } from '@/lib/log/log';

const queryClient = new QueryClient();

const App = () => {
  const store = domainStore;

  console.log('store', store);

  setupGlobalLog();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <div className={s.main}>
        <Outlet />
      </div>
    </QueryClientProvider>
  );
};

export default App;
