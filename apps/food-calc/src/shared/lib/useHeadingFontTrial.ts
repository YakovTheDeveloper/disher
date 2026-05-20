import { useEffect } from 'react';
import { useDesignVariant } from './useDesignVariant';

// Heading-font trial — переключается через DesignVariantsBar (anchor `Heading`,
// виден при `?dv=1`). Шрифты грузятся в index.html (Google Fonts), CSS-правила
// `--heading-*` — в shared/assets/style/heading-font-variants.scss.
const HEADING_FONT_VARIANTS = [
  'source-serif',
  'lora',
  'charis-sil',
  'alice',
  'pt-serif',
] as const;

/**
 * Применяет выбранный heading-font вариант к `<html>` (атрибуты
 * `data-dv`/`data-dv-v`), чтобы переменные `--heading-*` каскадировали на
 * КАЖДЫЙ `<Heading>` — включая модалки и drawer'ы, которые портятся в
 * `#modal-root` / `#drawer-root` вне `#root`. Вызывать один раз — в App.
 */
export function useHeadingFontTrial() {
  const { variant, anchor } = useDesignVariant('Heading', HEADING_FONT_VARIANTS);
  const anchorRef = anchor.ref;

  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-dv', 'Heading');
    el.setAttribute('data-dv-v', variant);
    // Привязываем IntersectionObserver к <html> — DesignVariantsBar считает
    // набор `Heading` видимым (он всегда на экране).
    anchorRef(el);
    return () => {
      el.removeAttribute('data-dv');
      el.removeAttribute('data-dv-v');
      anchorRef(null);
    };
  }, [variant, anchorRef]);
}
