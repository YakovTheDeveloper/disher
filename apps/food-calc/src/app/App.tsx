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
import { useDesignVariant } from '@/shared/lib/useDesignVariant';

// Глобальный ambient-backdrop (radial-glow обвязки экрана). Один anchor на
// app-уровне (`.main`) → DesignVariantsBar переключает свечение сразу для ВСЕХ
// страниц (HomePage / Schedule / Product / Dish / Analyses). Первый вариант =
// продакшен-дефолт (см. useDesignVariant fallback). CSS — App.module.scss
// (`.main[data-dv='HomeAmbient']`).
const HOME_AMBIENT_VARIANTS = [
  'lavender-cream',
  'peach-rose',
  'mint-sky',
  'sunrise',
  'plain',
] as const;

export default function App() {
  useLastFocusMethod();
  useUserAgentDetection();
  useGlobalScrollBlur();
  useApplyUserTheme();
  setupGlobalLog();

  const { anchor: ambientAnchor } = useDesignVariant('HomeAmbient', HOME_AMBIENT_VARIANTS);

  // Boot-hydrate the daily-analysis store from idb-keyval. Without this the
  // store starts empty on every reload — a completed daily review would not
  // reappear, and a mid-stream reload would never flip `streaming` →
  // `interrupted`. Fire-and-forget: the store sets `hydrated` and any mounted
  // DailyAnalysisSection re-renders when `byDate` arrives.
  useEffect(() => {
    void hydrateDailyAnalyses();
  }, []);

  // Publish the app-wide tone on `body[data-modal-fields]` — the tokens-only
  // attribute (no modal ambient/orbs/backdrop-filter), so ModalShell's single
  // fixed `mono` --field/card/chip/list-* cascade across every page AND through
  // Base UI portals. Replaces the old `data-surface` warm/lavender default and
  // the earlier multi-variant law-giver («great unification», 2026-06-19).
  // useLayoutEffect (not useEffect): set the attribute BEFORE first paint so
  // token-driven surfaces (`background: var(--card-bg)`, no fallback) never
  // flash unstyled on a cold load.
  useLayoutEffect(() => {
    document.body.setAttribute('data-modal-fields', 'mono');
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
      <div className={s.main} {...ambientAnchor}>
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
