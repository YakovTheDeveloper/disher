import { createContext, useContext } from 'react';
import type { ResolvedDrawerOptions } from '../overlay-types';

/**
 * Carries the drawer's anchor edge + width from DrawerManager down to
 * DrawerLayout. The side is decided at `drawerStore.show(..., { side })` call
 * time — not inside the drawer component — so it can't be a plain prop without
 * threading it through every drawer's props. The manager always provides this;
 * the `'bottom'` default only covers a DrawerLayout rendered outside a manager.
 */
const DrawerSideContext = createContext<ResolvedDrawerOptions>({ side: 'bottom' });

/** Wraps each open drawer instance — set by DrawerManager. */
export const DrawerSideProvider = DrawerSideContext.Provider;

/** Read inside DrawerLayout to pick bottom/left/right geometry. */
export const useDrawerSide = (): ResolvedDrawerOptions => useContext(DrawerSideContext);

/**
 * Живое состояние активной snap-фазы (обновляется на КАЖДОМ переходе между
 * фазами, в отличие от статичного `ResolvedDrawerOptions`). Питается из
 * `onSnapPointChange` Base UI в DrawerManager. Нужно, чтобы гасить внутренний
 * скролл тела на НЕверхней фазе: тогда драг по контенту — не скролл, а свайп
 * листа (Base UI пускает свайп только по НЕскроллящейся цели) → лист
 * разворачивается в верхнюю фазу «сразу как человек начал листать». На верхней
 * фазе скролл включается. `atTopSnap: true` по умолчанию — не-snap дроверы (и
 * DrawerLayout вне менеджера) скроллятся как обычно.
 */
type DrawerSnapValue = {
  atTopSnap: boolean;
  /** Есть ли вторая фаза, куда разворачивать (≥2 snap-точки). */
  canExpand: boolean;
  /**
   * Тап по grab-handle: разворачивает лист в верхнюю фазу, а из верхней — сворачивает
   * в базовую. Клавиатурный/скринридерный путь ко второй фазе (drag доступен не всем).
   * `undefined` у не-snap дроверов.
   */
  toggleSnap?: () => void;
};

const DrawerSnapContext = createContext<DrawerSnapValue>({ atTopSnap: true, canExpand: false });

export const DrawerSnapProvider = DrawerSnapContext.Provider;

export const useDrawerSnap = () => useContext(DrawerSnapContext);
