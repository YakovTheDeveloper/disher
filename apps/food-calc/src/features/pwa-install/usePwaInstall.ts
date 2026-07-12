import { useCallback, useEffect, useState } from 'react';
import { userAgentInfo } from '@/hooks/useUserAgentDetection';

// `beforeinstallprompt` is non-standard (Chromium-only) — no lib.dom typing.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type PwaPlatform = 'ios' | 'android' | 'other';

export interface PwaInstallState {
  /** Показать гейт: мобильный, не установлен, не отклонён в этой сессии. */
  shouldShow: boolean;
  platform: PwaPlatform;
  /** Android/Chromium: доступна нативная установка в один тап. */
  canPromptInstall: boolean;
  /** iOS: это Safari (умеет «На экран Домой»), а не Chrome/webview. */
  isIosSafari: boolean;
  /** Запустить нативный prompt (Android). Возвращает outcome. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  /** Escape-hatch: спрятать гейт до конца сессии. */
  dismiss: () => void;
}

// Сессионное отклонение (sessionStorage, НЕ localStorage): гейт «сильно
// настаивает» — гасится на текущую вкладку, но снова встречает при следующем
// запуске. Один тап «продолжить в браузере» не должен глушить его навсегда.
const DISMISS_KEY = 'disher.pwa-install.dismissed';

function isStandalone(): boolean {
  const iosStandalone = (navigator as { standalone?: boolean }).standalone === true;
  const displayMode =
    typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches;
  return iosStandalone || displayMode;
}

function detectIosSafari(): boolean {
  if (!userAgentInfo.isIOS) return false;
  const ua = navigator.userAgent;
  // На iOS «Добавить на экран Домой» умеет ТОЛЬКО Safari. Chrome (CriOS),
  // Firefox (FxiOS), Edge (EdgiOS), Opera (OPiOS), Google-app (GSA) и in-app
  // webview'ы (нет токена Safari) — не умеют, им показываем «откройте в Safari».
  const nonSafari = /(CriOS|FxiOS|EdgiOS|OPiOS|GSA)/i.test(ua);
  return /Safari/i.test(ua) && !nonSafari;
}

// beforeinstallprompt может выстрелить ДО монтирования React, поэтому ловим его
// на уровне модуля (импортируется из App синхронно) и реиграем в хук.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // гасим Chrome mini-infobar — установку ведём сами
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

export function usePwaInstall(): PwaInstallState {
  const platform: PwaPlatform = userAgentInfo.isIOS
    ? 'ios'
    : userAgentInfo.isAndroid
      ? 'android'
      : 'other';
  const isMobile = platform === 'ios' || platform === 'android';

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const fn = () => forceRerender((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private-mode / storage disabled — гейт просто вернётся, это ОК */
    }
    setDismissed(true);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable' as const;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // Prompt одноразовый — после использования Chrome его не отдаёт повторно.
    deferredPrompt = null;
    notify();
    return outcome;
  }, []);

  // В деве (LAN-тест с телефона) гейт не встречает — иначе каждый HMR-заход
  // упирается в экран установки. Прод-поведение не трогаем.
  const shouldShow = !import.meta.env.DEV && isMobile && !isStandalone() && !installed && !dismissed;

  return {
    shouldShow,
    platform,
    canPromptInstall: deferredPrompt !== null,
    isIosSafari: detectIosSafari(),
    promptInstall,
    dismiss,
  };
}
