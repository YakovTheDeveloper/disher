import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import s from '@/assets/style/App.module.scss';
import '@/assets/style/index.scss';
import '@/assets/style/App.module.scss';
import { domainStore } from '@/store/store';
import { Toaster } from 'react-hot-toast';
import { setupGlobalLog } from '@/lib/log/log';
import { Modal } from '@/components/ui/Modal';
import { ModalManager } from '@/ModalManager';

const queryClient = new QueryClient();

const App = () => {
  setupGlobalLog();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <div className={s.main}>
        <Modal>
          <ModalManager />
        </Modal>
        <Outlet />
      </div>
    </QueryClientProvider>
  );
};

export default App;
