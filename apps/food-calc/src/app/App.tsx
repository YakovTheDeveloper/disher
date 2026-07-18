import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import './fonts';
import s from '@/shared/assets/style/App.module.scss';
import '@/shared/assets/style/index.scss';
import '@/shared/assets/style/App.module.scss';
import { Toaster } from 'sonner';
import { setupGlobalLog } from '@/app/log';
import { ModalManager } from '@/app/ui/ModalManager';
import { useLastFocusMethod } from '@/hooks/useLastFocusMethod';
import { useUserAgentDetection } from '@/hooks/useUserAgentDetection';
import { useGlobalScrollBlur } from '@/hooks/useGlobalScrollBlur';
import DrawerManager from '@/app/ui/DrawerManager';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/i18n';
import { AuthGate } from '@/features/auth';
import { BackupGate } from '@/features/backup/BackupGate';
import { StoragePressureBanner } from '@/features/storage-warning/StoragePressureBanner';
import { PwaInstallGate } from '@/features/pwa-install';
import { useApplyUserTheme } from '@/shared/lib/user-theme';
import { useApplyColorMode } from '@/shared/lib/color-mode';
import { FabricLoader } from '@/features/analysis/FabricLoader';

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
  useApplyColorMode();
  setupGlobalLog();

  return (
    <I18nextProvider i18n={i18n}>
      {/*
        sonner is the single announced surface for transient errors (safeMutate,
        surfaceDexieError, handleSessionExpired). Its region carries role="status"
        + aria-live="polite" by default (error/warning toasts bump to "assertive"
        via `toast.error`), so error toasts are read out without extra wiring — do
        not add a competing aria-live region for the same messages.
      */}
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
        <PwaInstallGate />
        <StoragePressureBanner />
        <ModalManager />
        <DrawerManager />

        <AuthGate>
          <BackupGate>
            {/* Boundary for the route-level lazy pages (see router.tsx). While a
                page chunk loads, the app chrome stays mounted and this shows a
                centred spinner instead of a blank frame. */}
            <Suspense
              fallback={
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                  }}
                >
                  {/* Тот же лоадер, что на «Разборах» при идущем анализе
                      (AnalysesHero) — гравюра loader-analysis.png + scan. */}
                  <FabricLoader art="/art/loader-analysis.png" caption="Загрузка" effect="scan" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </BackupGate>
        </AuthGate>
      </div>
    </I18nextProvider>
  );
}
