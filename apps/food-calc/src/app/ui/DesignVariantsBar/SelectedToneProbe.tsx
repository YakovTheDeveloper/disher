import { useEffect } from 'react';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';

// DEV-only (Фаза-2 C1, 2026-06-24): живой тестер оттенка «выбрано» / navy-brand
// через DesignBar. Регистрирует anchor `SelectedTone` в баре (выбери его в
// dropdown'е, щёлкай чипы), а variant рефлектится на `<html data-selected-tone>`
// — root-уровень покрывает и портальные оверлеи (модалки Анализа, ConfirmModal),
// которые компонент-anchor не достаёт. CSS-оверрайды тонов — themes.scss
// (`:root[data-selected-tone=...]`), значения/APCA — scratchpad/crit.mjs +
// предложка /suggestion_warm_navy_status. `navy` = дефолт (без override).
const TONES = [
  'navy', // дефолт (без override) — текущий
  'coal-warm', // тёплый-уголь-софт
  'yellow-pale', // pale-yellow зеркало CTA
  'amber-deep', // амбер-глубокий (тёплая семья)
  'plum', // слива/баклажан
  'teal', // тил (зелень-мост)
  'indigo', // индиго-фиолет
  'terracotta', // ⚠ коллизия с danger
] as const;

export function SelectedToneProbe() {
  const { variant, anchor } = useDesignVariant('SelectedTone', TONES);

  useEffect(() => {
    const el = document.documentElement;
    if (variant === 'navy') el.removeAttribute('data-selected-tone');
    else el.setAttribute('data-selected-tone', variant);
    return () => el.removeAttribute('data-selected-tone');
  }, [variant]);

  // Невидимый якорь — баром управляем через dropdown+чипы (visibility не нужна).
  return (
    <span
      {...anchor}
      aria-hidden
      style={{ position: 'fixed', top: 0, left: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
    />
  );
}
