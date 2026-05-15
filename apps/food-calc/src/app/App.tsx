import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import s from '@/shared/assets/style/App.module.scss';
import '@/shared/assets/style/index.scss';
import '@/shared/assets/style/App.module.scss';
import { Toaster } from 'sonner';
import { setupGlobalLog } from '@/app/log';
import { hydrateDailyAnalyses } from '@/features/analysis/daily';
import { ModalManager } from '@/app/ui/ModalManager';
import { useLastFocusMethod } from '@/hooks/useLastFocusMethod';
import { useUserAgentDetection } from '@/hooks/useUserAgentDetection';
import { useGlobalScrollBlur } from '@/hooks/useGlobalScrollBlur';
import DrawerManager from '@/app/ui/DrawerManager';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/i18n';
import { AuthGate } from '@/features/auth';
import { BackupGate } from '@/features/backup/BackupGate';
import { useApplyUserTheme } from '@/shared/lib/user-theme';

export default function App() {
  useLastFocusMethod();
  useUserAgentDetection();
  useGlobalScrollBlur();
  useApplyUserTheme();
  setupGlobalLog();

  // Boot-hydrate the daily-analysis store from idb-keyval. Without this the
  // store starts empty on every reload — a completed daily review would not
  // reappear, and a mid-stream reload would never flip `streaming` →
  // `interrupted`. Fire-and-forget: the store sets `hydrated` and any mounted
  // DailyAnalysisSection re-renders when `byDate` arrives.
  useEffect(() => {
    void hydrateDailyAnalyses();
  }, []);

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
        <ModalManager />
        <DrawerManager />

        <AuthGate>
          <BackupGate>
            <Outlet />
          </BackupGate>
        </AuthGate>
      </div>
    </I18nextProvider>
  );
}
