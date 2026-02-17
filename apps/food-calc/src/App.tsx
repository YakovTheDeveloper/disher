import { AnimatedOutlet } from '@/components/ui/PageTransition';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import s from '@/assets/style/App.module.scss';
import '@/assets/style/index.scss';
import '@/assets/style/App.module.scss';
import { Toaster } from 'react-hot-toast';
import { setupGlobalLog } from '@/lib/log/log';
import { Modal } from '@/components/ui/Modal';
import { ModalManager } from '@/ModalManager';
import { ModalManagerV2 } from '@/components/ModalManagerV2';
import { Drawer } from '@/components/ui/Drawer';
import { useLastFocusMethod } from '@/hooks/useLastFocusMethod';
import { useUserAgentDetection } from '@/hooks/useUserAgentDetection';
import DrawerManagerV2 from '@/DrawerManagerV2';
import { domainStore } from '@/store/store';
import { observer } from 'mobx-react-lite';
import { I18nextProvider } from 'react-i18next';
import '@/i18n';

const queryClient = new QueryClient();

const App = () => {
  useLastFocusMethod();
  useUserAgentDetection();
  setupGlobalLog();

  if (!domainStore.isHydrated) {
    return <div>загрузка</div>;
  }

  return (
    <I18nextProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <div className={s.main}>
          <Modal>
            {/* <ModalManager /> */}
            <ModalManagerV2 />
          </Modal>
          <Drawer>
            <DrawerManagerV2 />
          </Drawer>
          <AnimatedOutlet />
        </div>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default observer(App);
