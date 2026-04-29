import { Outlet } from 'react-router-dom';
import s from '@/shared/assets/style/App.module.scss';
import '@/shared/assets/style/index.scss';
import '@/shared/assets/style/App.module.scss';
import { Toaster } from 'sonner';
import { setupGlobalLog } from '@/app/log';
import { Modal } from '@/shared/ui/Modal';
import { ModalManager } from '@/app/ui/ModalManager';
import { Drawer } from '@/shared/ui/Drawer';
import { useLastFocusMethod } from '@/hooks/useLastFocusMethod';
import { useUserAgentDetection } from '@/hooks/useUserAgentDetection';
import { useGlobalScrollBlur } from '@/hooks/useGlobalScrollBlur';
import DrawerManager from '@/app/ui/DrawerManager';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/i18n';
import { DesignVariantsBar, shouldShowDvBar } from '@/app/ui/DesignVariantsBar';

export default function App() {
  useLastFocusMethod();
  useUserAgentDetection();
  useGlobalScrollBlur();
  setupGlobalLog();

  return (
    <I18nextProvider i18n={i18n}>
      <Toaster
        position="top-center"
        duration={6000}
        closeButton
        toastOptions={{
          classNames: {
            toast: 'toast',
            success: 'toast--success',
            error: 'toast--error',
            info: 'toast--info',
            warning: 'toast--warning',
          },
        }}
      />
      <div className={s.main}>
        {shouldShowDvBar() && <DesignVariantsBar />}
        <Modal>
          <ModalManager />
        </Modal>

        <Drawer>
          <DrawerManager />
        </Drawer>

        <Outlet />
      </div>
    </I18nextProvider>
  );
}
