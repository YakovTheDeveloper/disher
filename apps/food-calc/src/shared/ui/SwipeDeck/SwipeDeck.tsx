import { Fragment, useCallback, useEffect, useMemo, useRef, type ReactNode, type Ref } from 'react';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { TopBarScrollHideContext, useTopBarScrollHideController } from '@/shared/ui/Screen';
import s from './SwipeDeck.module.scss';

// SwipeDeck — общий каркас обвязки многослайдовой страницы (Home / Dish /
// Discoveries). Владеет ВСЕЙ одинаковой механикой: container-обвязка + стекло
// SheetMaterial + scroll-hide бара + Embla-свайп + плитки-переключатель
// (ScreenIndicator) по слайду. Страница отдаёт лишь «бар + N слайдов».
//
// Инвариант zero-React-render свайпа: каркас НЕ держит активный индекс в state.
// Смена слайда — императивна (`setHide('none')` + опц. `onIndexChange`), per-slide
// topSlot мемоизирован. Поэтому Embla двигает DOM сам, React молчит.

// NavSwitcher — облик плиток-переключателя (живой DEV-тоггл). Anchor на
// `.swipeArea`. Первый = дефолт (`tab-as-title`: активный раздел = крупный
// заголовок, неактивные — тихие serif-указатели). Все варианты дают листу
// крупный радиус верхних углов (см. SwipeDeck.module.scss).
//   tab-as-title         — активный раздел крупным заголовком (лево).
//   tab-as-title-center  — то же, по центру.
//   tab-inplace          — короткий лейбл активного «садится» в свою позицию.
//   tab-numerals         — own-line заголовок + номера таблиц I·II·III.
//   tab-numerals-left    — то же, лево-выровнено.
const NAV_SWITCHER_VARIANTS = [
  'tab-as-title',
  'tab-as-title-center',
  'tab-inplace',
  'tab-numerals',
  'tab-numerals-left',
] as const;

// SheetMaterial — «история» материала контент-листа (живой DEV-тоггл). Anchor на
// `.container`. БАЗА `band` — стеклянная полка сверху + бумага ниже; `dissolve` —
// верх плавно растворяется из стекла в бумагу. CSS-карта — SwipeDeck.module.scss.
const SHEET_MATERIAL_VARIANTS = ['band', 'dissolve'] as const;

export type DeckSlide = {
  // Контент слайда. Получает готовый topSlot (hero?+ScreenIndicator), который слайд
  // форвардит в свой `<Screen stickyTop={topSlot}>` (Dish/Discoveries) ИЛИ в доменный
  // виджет, который сам владеет Screen (Home). Каркас агностичен к владельцу Screen.
  render: (topSlot: ReactNode) => ReactNode;
};

type Props = {
  /** Лейблы разделов для плиток. ОБЯЗАН быть стабильной module-const (иначе memo
   *  topSlot отдаёт устаревший). */
  screens: ScreenEntry[];
  /** Слайды; `slides.length === screens.length`, ≥2. */
  slides: DeckSlide[];
  /** Первый показываемый слайд. */
  defaultSlide?: number;
  /** Рендер плавающего бара. Получает `shellRef` каркаса (для scroll-hide). */
  renderTopBar: (shellRef: Ref<HTMLDivElement>) => ReactNode;
  /** Доп. императивная побочка при смене слайда (Home: чистка recentlyAdded).
   *  Должен быть стабильным (useCallback). */
  onIndexChange?: () => void;
  /** Опц. hero-обложка над плитками. ТОЛЬКО Home; должен быть стабильным
   *  (useCallback). Передан → на `.container` ставится `data-deck-hero` (включает
   *  белый watermark над стеклом). Не передан → обложки нет, watermark тёмный. */
  heroForSlide?: (i: number) => ReactNode;
  /** Accessible name для role="tablist" плиток. Дефолт — «Экран» (Home/Dish).
   *  Discoveries передаёт «Открытия: раздел» (контентный переключатель). */
  tablistLabel?: string;
};

export const SwipeDeck = ({
  screens,
  slides,
  defaultSlide = 1,
  renderTopBar,
  onIndexChange,
  heroForSlide,
  tablistLabel,
}: Props) => {
  const swipeableRef = useRef<SwipeableRef>(null);

  // Dev-инвариант: плитки строятся из `screens`, контент — из `slides`. При
  // рассинхроне длин слайд получит `topSlot=undefined` (без плиток) тихо —
  // кричим в дев-режиме, чтобы поймать контракт-нарушение на месте.
  useEffect(() => {
    if (import.meta.env.DEV && slides.length !== screens.length) {
      console.warn(
        `SwipeDeck: slides.length (${slides.length}) !== screens.length (${screens.length}) — слайд без плиток или плитки без слайда.`
      );
    }
  }, [slides.length, screens.length]);

  // Якорь облика плиток — на `.swipeArea` (потомки-плитки ловят `[data-dv-v]`).
  const { anchor: navAnchor } = useDesignVariant('NavSwitcher', NAV_SWITCHER_VARIANTS);
  // Якорь материала листа — на `.container` (предок листа Screen в слайдах).
  const { anchor: sheetAnchor } = useDesignVariant('SheetMaterial', SHEET_MATERIAL_VARIANTS);

  // Направление-зависимое скрытие кнопок бара при скролле. Контроллер пишет
  // `data-topbar-hide` на `.shell` бара императивно — свайп остаётся zero-render.
  const { shellRef, setHide, api } = useTopBarScrollHideController();

  // Смена слайда → бар видим («с верха»), затем опц. побочка страницы. Императивно,
  // без подписки на индекс → Page не ре-рендерится на свайпе.
  const handleIndexChange = useCallback(() => {
    setHide('none');
    onIndexChange?.();
  }, [setHide, onIndexChange]);

  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
  }, []);

  // Per-slide topSlot: hero (опц.) НАД статичным ScreenIndicator своего слайда.
  // `slideIndex={i}` → каждый инстанс статично подсвечивает СВОЙ раздел; title не
  // прыгает при свайпе, активный индекс не нужен в React-state. Мемоизировано со
  // стабильными deps → стабильная идентичность → memo() слайдов не сбрасывается.
  const topSlots = useMemo(
    () =>
      screens.map((_, i) => (
        <Fragment key={i}>
          {heroForSlide?.(i)}
          <ScreenIndicator
            screens={screens}
            slideIndex={i}
            onSelect={handleSelect}
            tablistLabel={tablistLabel}
          />
        </Fragment>
      )),
    [screens, heroForSlide, handleSelect, tablistLabel]
  );

  return (
    <div className={s.container} data-deck-hero={heroForSlide ? '' : undefined} {...sheetAnchor}>
      {renderTopBar(shellRef)}
      <div className={s.swipeArea} {...navAnchor}>
        <TopBarScrollHideContext.Provider value={api}>
          <div className={s.tabsAnchor}>
            <Swipeable
              ref={swipeableRef}
              defaultSlide={defaultSlide}
              duration={0}
              hasDots={false}
              onIndexChange={handleIndexChange}
            >
              {slides.map((slide, i) => (
                <div key={i} className={s.slideFrame}>
                  {slide.render(topSlots[i])}
                </div>
              ))}
            </Swipeable>
          </div>
        </TopBarScrollHideContext.Provider>
      </div>
    </div>
  );
};

export default SwipeDeck;
