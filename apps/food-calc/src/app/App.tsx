import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import './fonts';
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

// Single app-wide tone. Every interactive surface (--sys-field-* inputs/chips,
// --sys-card-*/--list-* rows) derives its colour from ONE palette: the fixed `mono`
// inputs published UNCONDITIONALLY on `:root` in ModalShell.module.scss. There is
// no longer an APP_TONE const or a `data-modal-fields` attribute setter here — the
// tone-switch had exactly one position, so the attribute gated nothing and was
// removed 2026-06-22 (publication is now pure CSS on `:root`, no JS). To re-shade,
// edit the `:root` mono inputs in ModalShell.module.scss.
// (Replaced the retired `data-surface` warm/lavender axis — fully removed
// 2026-06-20.)
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
