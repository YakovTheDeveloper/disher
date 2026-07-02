import { useEffect, useRef, type RefObject } from 'react';

/**
 * iOS-first «keyboard-aware scroll» — держит сфокусированный инпут над экранной
 * клавиатурой. Канонический метод в приложении для полноэкранных форм на
 * `position: fixed` (AuthScreen и т.п.).
 *
 * ── Почему нельзя проще ────────────────────────────────────────────────────
 * В Safari (2026) НЕТ ни VirtualKeyboard API (`env(keyboard-inset-*)`), ни
 * `interactive-widget=resizes-content` — единственный сигнал о клавиатуре это
 * `window.visualViewport`. При этом:
 *  1. iOS НЕ сжимает layout viewport (и `dvh`) под клавиатуру — она overlays.
 *     Значит `position: fixed; height: 100dvh` остаётся 100dvh, у скроллера нет
 *     overflow → скроллить физически нечего.
 *  2. Нативный scroll-on-focus и `scrollIntoView` КЛАВИАТУРО-СЛЕПЫЕ: считают
 *     инпут «видимым» по layout viewport и оставляют его под клавиатурой —
 *     отсюда прерывистое «то скроллит, то нет».
 *
 * ── Что делает хук (два яруса, без «подёргиваний») ─────────────────────────
 *  • ДЁШЕВО и живо (rAF, на каждый resize/scroll): пишет высоту клавиатуры в
 *    CSS-переменную `--kb` на контейнере. Меняет только невидимую зону ниже
 *    сгиба — видимый контент не двигает.
 *  • ДОРОГО и редко (дебаунс по устаканиванию вьюпорта): один плавный `scrollTo`
 *    по ФАКТИЧЕСКОМУ перекрытию инпута нижней кромкой видимой зоны. Не гонится
 *    за каждым кадром анимации клавиатуры.
 * Веб-порт RN KeyboardAwareScrollView.
 *
 * ── CSS-контракт (обязателен на контейнере, к которому цепляется ref) ───────
 *   - контейнер — ЕДИНСТВЕННЫЙ скроллер: `overflow-y: auto` (никакого вложенного
 *     `overflow` внутри — иначе iOS скроллит не тот элемент);
 *   - `padding-bottom: var(--kb, 0px)` — запас, создающий диапазон прокрутки.
 *
 * Когда WebKit завезёт `interactive-widget=resizes-content`, хук и контракт
 * можно будет удалить.
 *
 * @returns ref для навешивания на скролл-контейнер формы.
 */
export function useKeyboardAwareScroll<T extends HTMLElement>(
  opts: { enabled?: boolean; margin?: number; settleMs?: number } = {},
): RefObject<T | null> {
  const { enabled = true, margin = 16, settleMs = 120 } = opts;
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;
    const vv = window.visualViewport;
    const scroller = ref.current;
    if (!vv || !scroller) return;

    let raf = 0;
    let settle = 0;

    const syncKb = () => {
      raf = 0;
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      scroller.style.setProperty('--kb', `${kb}px`);
    };
    const scheduleKb = () => {
      if (!raf) raf = requestAnimationFrame(syncKb);
    };

    const reveal = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || !scroller.contains(el)) return;
      if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
      const rect = el.getBoundingClientRect();
      // Нижняя кромка ВИДИМОЙ области в координатах layout viewport (в них же
      // отдаёт getBoundingClientRect): смещение визуального вьюпорта + его высота.
      const visibleBottom = vv.offsetTop + vv.height;
      const overlap = rect.bottom - visibleBottom + margin;
      if (overlap > 2) scroller.scrollTo({ top: scroller.scrollTop + overlap, behavior: 'smooth' });
    };
    const scheduleReveal = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(reveal, settleMs);
    };

    const onResize = () => {
      scheduleKb();
      scheduleReveal();
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', scheduleKb);
    scroller.addEventListener('focusin', scheduleReveal);
    syncKb();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', scheduleKb);
      scroller.removeEventListener('focusin', scheduleReveal);
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [enabled, margin, settleMs]);

  return ref;
}
