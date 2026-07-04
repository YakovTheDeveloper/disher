import { Fragment, useCallback, useEffect, useMemo, useRef, type ReactNode, type Ref } from 'react';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
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
  /** Слайды; `slides.length === screens.length`. ≥2 → многослайдовый дек с
   *  плитками-переключателем. ===1 → single-slide режим (ряд табов не рендерится,
   *  chrome + hero-полка остаются; долгие анализы). При ===1 передавай
   *  `defaultSlide={0}` (дефолт 1 выйдет за границы). */
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
  /** Выравнивание заголовка-таба + ряда номеров: `left` (дефолт) / `center`.
   *  Ставит `data-nav-align` на anchor-узел `.swipeArea` (см. SwitcherTab /
   *  ScreenIndicator). Заменил бывшую dv-пару `tab-numerals-left` / `tab-numerals`. */
  align?: 'left' | 'center';
  /** Поведение стрелок-указателей плиток (форвард в ScreenIndicator). `all`
   *  (дефолт) — у каждого неактивного таба; `middle-right` — одна правая стрелка
   *  на серединном слайде (ставит Home по запросу). */
  arrowHint?: 'all' | 'middle-right';
};

export const SwipeDeck = ({
  screens,
  slides,
  defaultSlide = 1,
  renderTopBar,
  onIndexChange,
  heroForSlide,
  tablistLabel,
  align = 'left',
  arrowHint = 'all',
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

  // Single-slide режим: дек из ОДНОГО экрана (долгие анализы). Переключать нечего
  // → ряд плиток-табов не рендерится (у одинокого таба нет соседа, стрелок нет).
  // Каркас всё равно нужен ради ЕДИНОГО chrome + консистентного верхнего отступа:
  // hero-полка резервируется как на всех деках, так что список стартует на той же
  // высоте, что Открытия/Home, только без ряда табов над ним.
  const singleSlide = screens.length === 1;

  // Per-slide topSlot: hero (опц.) НАД статичным ScreenIndicator своего слайда.
  // `slideIndex={i}` → каждый инстанс статично подсвечивает СВОЙ раздел; title не
  // прыгает при свайпе, активный индекс не нужен в React-state. Мемоизировано со
  // стабильными deps → стабильная идентичность → memo() слайдов не сбрасывается.
  const topSlots = useMemo(
    () =>
      screens.map((_, i) => (
        <Fragment key={i}>
          {/* Hero-слот ВСЕГДА резервирует постоянную высоту (`--deck-hero-h`) —
              на любом деке, с обложкой и без. Так верхний отступ консистентен на
              всех экранах (Home / Блюдо / Открытия / долгие анализы): контент
              стартует на одной высоте. Когда `heroForSlide` не передан или вернул
              пусто — слот пустой, но высоту держит. */}
          <div className={s.heroSlot}>{heroForSlide?.(i)}</div>
          {!singleSlide && (
            <ScreenIndicator
              screens={screens}
              slideIndex={i}
              onSelect={handleSelect}
              tablistLabel={tablistLabel}
              arrowHint={arrowHint}
            />
          )}
        </Fragment>
      )),
    [screens, heroForSlide, handleSelect, tablistLabel, arrowHint, singleSlide]
  );

  return (
    <div className={s.container} data-deck-hero={heroForSlide ? '' : undefined}>
      {renderTopBar(shellRef)}
      <div className={s.swipeArea} data-nav-align={align}>
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
