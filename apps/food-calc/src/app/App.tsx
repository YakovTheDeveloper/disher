import { useEffect, useLayoutEffect } from 'react';
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

// Single app-wide tone. THIS is the theming loophole: every interactive surface
// (--field-* inputs/chips, --card-*/--list-* rows) derives its colour from ONE
// palette entry, keyed by this name. To re-shade or add a theme:
//   1. edit / add an entry in `$modal-shell-field-chip` (ModalShell.module.scss),
//   2. point APP_TONE at it (or make it stateful for a runtime picker).
// Nothing else hard-codes a colour — it all flows from the tokens here.
// (Replaced the retired `data-surface` warm/lavender axis — fully removed
// 2026-06-20.)
const APP_TONE = 'mono';

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

  // Publish the app-wide tone on `body[data-modal-fields]` — the tokens-only
  // attribute (no modal ambient/orbs/backdrop-filter), so the single APP_TONE
  // --field/card/chip/list-* cascade across every page AND through Base UI
  // portals. See APP_TONE above for the theming loophole.
  // useLayoutEffect (not useEffect): set the attribute BEFORE first paint so
  // token-driven surfaces (`background: var(--card-bg)`, no fallback) never
  // flash unstyled on a cold load.
  useLayoutEffect(() => {
    document.body.setAttribute('data-modal-fields', APP_TONE);
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
