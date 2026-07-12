// PwaInstallGate — платформенное ветвление гейта установки. Под тестом:
// (1) на десктопе/не-мобильном гейт НИЧЕГО не рендерит (не мешает установленным
// и десктоп-юзерам), (2) Android с пойманным beforeinstallprompt показывает
// нативный CTA, (3) iOS Safari показывает пошаговую инструкцию «Поделиться».
// userAgentInfo и matchMedia застабаны, чтобы изолировать это отображение.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const ua = { isIOS: false, isAndroid: false, engine: 'Unknown', supportsAutofocus: true };
vi.mock('@/hooks/useUserAgentDetection', () => ({
  get userAgentInfo() {
    return ua;
  },
  useUserAgentDetection: () => {},
}));

vi.mock('@/shared/assets/icons/download.svg?react', () => ({
  default: () => <svg data-testid="download-icon" />,
}));

vi.mock('./PwaInstallGate.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `pig-${String(p)}` }),
}));

function setUa(next: Partial<typeof ua>) {
  Object.assign(ua, next);
}

function setUserAgentString(value: string) {
  Object.defineProperty(navigator, 'userAgent', { value, configurable: true });
}

beforeEach(() => {
  vi.resetModules();
  // Под vitest import.meta.env.DEV=true, а гейт в деве отключён — тестируем прод.
  vi.stubEnv('DEV', false);
  setUa({ isIOS: false, isAndroid: false });
  // matchMedia(display-mode: standalone) → false (обычная вкладка, не установлено).
  Object.defineProperty(navigator, 'standalone', { value: false, configurable: true });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
});

async function renderGate() {
  const { PwaInstallGate } = await import('./PwaInstallGate');
  return render(<PwaInstallGate />);
}

describe('PwaInstallGate', () => {
  it('на десктопе (не мобильный) не рендерит ничего', async () => {
    const { container } = await renderGate();
    expect(container).toBeEmptyDOMElement();
  });

  it('в установленном приложении (standalone) не рендерит ничего даже на мобильном', async () => {
    setUa({ isAndroid: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    const { container } = await renderGate();
    expect(container).toBeEmptyDOMElement();
  });

  it('Android с пойманным beforeinstallprompt показывает нативный CTA', async () => {
    setUa({ isAndroid: true });
    // Ловит промпт на уровне модуля — импортируем ПОСЛЕ выставления слушателя.
    const { PwaInstallGate } = await import('./PwaInstallGate');
    const evt = new Event('beforeinstallprompt') as Event & { prompt?: unknown };
    window.dispatchEvent(evt);
    render(<PwaInstallGate />);
    expect(screen.getByText('Установить приложение')).toBeInTheDocument();
    expect(screen.getByText('Продолжить в браузере')).toBeInTheDocument();
  });

  it('Android без промпта показывает ручную инструкцию', async () => {
    setUa({ isAndroid: true });
    await renderGate();
    expect(screen.getByText(/Установить приложение|Добавить на главный экран/)).toBeInTheDocument();
    expect(screen.getByText(/меню браузера/i)).toBeInTheDocument();
  });

  it('iOS Safari показывает инструкцию «Поделиться → На экран Домой»', async () => {
    setUa({ isIOS: true });
    setUserAgentString(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    );
    await renderGate();
    expect(screen.getByText(/Поделиться/)).toBeInTheDocument();
    expect(screen.getByText(/На экран/)).toBeInTheDocument();
  });

  it('iOS не-Safari (Chrome) показывает подсказку открыть в Safari', async () => {
    setUa({ isIOS: true });
    setUserAgentString(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1',
    );
    await renderGate();
    expect(screen.getByText(/из других браузеров на iPhone/i)).toBeInTheDocument();
  });
});
