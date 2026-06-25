import { useEffect } from 'react';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';

// DEV-only: живой выбор облика `*-secondary` кнопок через DesignBar. Регистрирует
// anchor `ButtonSecondary` (выбери в dropdown'е, щёлкай чипы), variant рефлектится
// на `<html data-btn-secondary>` — root-уровень покрывает и портальные оверлеи
// (модалки/дроверы), которые компонент-anchor не достаёт. CSS-развилка —
// Button.module.css (`:root[data-btn-secondary=...]`). `soft` = дефолт (заливка
// без бордюра, атрибут не ставится).
const VARIANTS = [
  'soft', // дефолт — soft-tonal заливка, без бордюра
  'border', // прозрачный + тональный бордюр
  'soft-border', // и подложка, и бордюр
] as const;

export function ButtonSecondaryProbe() {
  const { variant, anchor } = useDesignVariant('ButtonSecondary', VARIANTS);

  useEffect(() => {
    const el = document.documentElement;
    if (variant === 'soft') el.removeAttribute('data-btn-secondary');
    else el.setAttribute('data-btn-secondary', variant);
    return () => el.removeAttribute('data-btn-secondary');
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
