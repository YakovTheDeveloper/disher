import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import s from '@/assets/style/App.module.scss';
import '@/assets/style/index.scss';
import '@/assets/style/App.module.scss';
import { Toaster } from 'react-hot-toast';
import { setupGlobalLog } from '@/lib/log/log';
import { Modal } from '@/components/ui/Modal';
import { ModalManager } from '@/ModalManager';
import { Drawer } from '@/components/ui/Drawer';
import { DrawerManager } from '@/DrawerManager';
import { useLastFocusMethod } from '@/hooks/useLastFocusMethod';
import { useUserAgentDetection } from '@/hooks/useUserAgentDetection';

const queryClient = new QueryClient();

const App = () => {
  useLastFocusMethod();
  useUserAgentDetection();
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
