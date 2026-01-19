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
import { Drawer } from '@/components/ui/Drawer';
import { DrawerManager } from '@/DrawerManager';
import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useLastFocusMethod } from '@/hooks/useLastFocusMethod';

const queryClient = new QueryClient();

const App = () => {
  useLastFocusMethod();
  setupGlobalLog();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <div className={s.main}>
        <Modal>
          <ModalManager />
        </Modal>
        <Drawer>
          <DrawerManager />
        </Drawer>
        <Outlet />
      </div>
    </QueryClientProvider>
  );
};

export default App;
