import { createContext, useCallback, useMemo, useRef } from 'react';

// Направление-зависимое скрытие кнопок `HomeTopBar` при скролле (Headroom-канон).
//
// Бар — ОДИН общий плавающий инстанс над слайдами Embla, а активный слайд
// намеренно не живёт в React-стейте (канон «свайп = ноль ре-рендеров»,
// см. HomePage). Поэтому связь «скролл активного экрана → бар» — императивная:
// контроллер держит ref на `.shell` бара и пишет `data-topbar-hide` прямо в DOM
// (без setState, без ре-рендера). CSS в `HomeTopBar.module.scss` маппит атрибут
// на transform/opacity (composite-only).
//
// `Screen` (потребитель контекста) сам решает, КОГДА звать `setHide`: вешает
// passive + rAF scroll-листенер на свой `.screenScroll` и сравнивает направление.
// Активный экран определяется естественно — скроллится только он; смена слайда
// сбрасывает бар в видимое состояние через `setHide('none')` в `onIndexChange`.

/** Что прячет конкретный экран, когда внутри него листают вниз.
 *  `settings` — только пилюлю аккаунта; `all` — аккаунт + нутриенты + дату
 *  (кнопка «Назад» на DishPage не трогается никогда). */
export type TopBarHideTarget = 'settings' | 'all';

/** Текущее состояние бара. `none` = всё видно. */
export type TopBarHideState = 'none' | TopBarHideTarget;

export type TopBarScrollHideApi = {
  /** Императивно выставить состояние бара (пишет `data-topbar-hide` в DOM). */
  setHide: (state: TopBarHideState) => void;
};

/** `null` вне провайдера → `Screen` работает как раньше (эффект не вешается). */
export const TopBarScrollHideContext = createContext<TopBarScrollHideApi | null>(null);

/**
 * Создаёт контроллер для страницы со `Swipeable`-баром. Возвращает:
 *  - `shellRef` — повесить на `.shell` `HomeTopBar` (через проп `shellRef`);
 *  - `setHide`  — звать в `onIndexChange` слайдера, чтобы при смене экрана бар
 *                 возвращался (`'none'`);
 *  - `api`      — положить в `TopBarScrollHideContext.Provider`.
 *
 * Идентичность `setHide`/`api` стабильна → провайдер не вызывает лишних
 * ре-рендеров `Screen`, эффект-подписка вешается один раз.
 */
export function useTopBarScrollHideController() {
  const shellRef = useRef<HTMLDivElement | null>(null);

  const setHide = useCallback((state: TopBarHideState) => {
    const el = shellRef.current;
    if (!el) return;
    const next = state === 'none' ? '' : state;
    // Сравниваем перед записью — лишние мутации dataset инвалидируют стиль зря.
    if (el.dataset.topbarHide === next) return;
    if (next) el.dataset.topbarHide = next;
    else delete el.dataset.topbarHide;
  }, []);

  const api = useMemo<TopBarScrollHideApi>(() => ({ setHide }), [setHide]);

  return { shellRef, setHide, api };
}
