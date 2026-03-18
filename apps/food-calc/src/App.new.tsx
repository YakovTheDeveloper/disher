import { AnimatedOutlet } from '@/components/ui/PageTransition';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import s from '@/assets/style/App.module.scss';
import '@/assets/style/index.scss';
import '@/assets/style/App.module.scss';
import { Toaster } from 'react-hot-toast';
import { setupGlobalLog } from '@/lib/log/log';
import { Modal } from '@/components/ui/Modal';
import { ModalManagerV2 } from '@/components/ModalManagerV2';
import { Drawer } from '@/components/ui/Drawer';
import { useLastFocusMethod } from '@/hooks/useLastFocusMethod';
import { useUserAgentDetection } from '@/hooks/useUserAgentDetection';
import { useGlobalScrollBlur } from '@/hooks/useGlobalScrollBlur';
import DrawerManagerV3 from '@/components/DrawerManagerV3';
import { I18nextProvider } from 'react-i18next';
import '@/i18n';

const queryClient = new QueryClient();

export default function App() {
  useLastFocusMethod();
  useUserAgentDetection();
  useGlobalScrollBlur();
  setupGlobalLog();

  return (
    <I18nextProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <div className={s.main}>
          <Modal>
            <ModalManagerV2 />
          </Modal>

          <Drawer>
            <DrawerManagerV3 />
          </Drawer>

          <AnimatedOutlet />
        </div>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
