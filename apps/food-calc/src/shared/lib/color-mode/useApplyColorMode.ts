import { useEffect } from 'react';
import { useColorModeStore } from './color-mode-store';

const MODE_ATTR = 'data-theme-mode';

/**
 * Reflects the current light/dark mode onto `<html data-theme-mode="...">`
 * so the CSS rules in `theme-dark.scss` (`:root[data-theme-mode='dark']`) can
 * flip the semantic token layer globally. Runs once at mount + on every change.
 * Also the SOLE writer of `meta[theme-color]` (the PWA status-bar colour) — see
 * the note in the effect. `data-theme` (palette) doesn't touch surface-0, so the
 * mode is the only axis that can move it.
 *
 * Orthogonal to `useApplyUserTheme` (which owns `data-theme` — the colour
 * palette). The two attributes coexist: a user can pick `meadow` AND dark; the
 * dark layer is imported after `themes.scss`, so at equal specificity it wins,
 * giving the TOD palettes their dark treatment regardless of palette choice.
 */
export function useApplyColorMode(): void {
  const mode = useColorModeStore((s) => s.mode);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute(MODE_ATTR, mode);

    // Верхний status bar PWA красит meta[theme-color] — и ТОЛЬКО он. Нижнюю полосу
    // из страницы не достать вообще: во вкладке Android её красит canvas документа
    // (= фон `body`, см. index.scss), в установленном PWA — тема Activity, и туда
    // пути нет ни из манифеста, ни из DOM. Разбор:
    // tds/ANALYSIS/android-bottom-nav-bar-2026-07-16.md.
    // Читаем уже применённый surface-0 из каскада, а не дублируем hex: единственный
    // источник правды остаётся в токенах, и шапка не разъедется при перекраске темы.
    const surface0 = getComputedStyle(root).getPropertyValue('--sys-color-surface-0').trim();
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta && surface0) meta.content = surface0;
  }, [mode]);
}
