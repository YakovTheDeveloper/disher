import styles from './Screen.module.scss';
import clsx from 'clsx';
import { useRef, useEffect, useContext, memo } from 'react';
import { useScrollBottomIndicator } from '@/hooks/useScrollBottomIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';
import { TopBarScrollHideContext, type TopBarHideTarget } from './topBarScrollHide';
import { QuietLabel } from '@/shared/ui/atoms/Typography';

// Направление-зависимое скрытие бара (см. `topBarScrollHide`).
// Порог движения — гасит дрожание на микро-скроллах/«резинке».
const HIDE_DIR_THRESHOLD_PX = 8;
// У самого верха бар всегда виден (не прячем «шапку списка»).
const HIDE_REVEAL_TOP_PX = 24;

// Верхняя «полка» листа `.headerOverlap` (--sheet-band-h) — финальный канон
// (2026-06-27, слиты grabber+dateline в один вид; DesignBar-форки SheetSurface
// свёрнуты): центральный хват-пилюля (метафора «лист, тянется») и опциональный
// день недели слева — его прокидывает страница через `sheetDateLabel` (на Рацион =
// настоящий день из даты; экраны без даты — Dish/Product/Открытия — полку несёт
// только хват). Watermark-логотип Disher справа снят 2026-06-27 (на Рационе его
// место в углу занимает дата листа). Divider убран.

type Props = {
  children: React.ReactNode;
  actions?: React.ReactNode;
  bottomRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomBar?: React.ReactNode;
  header?: React.ReactNode;
  /**
   * Верхний слот листа — рендерится первым ВНУТРИ листа (`headerOverlap`), сразу
   * после полки/`headerAction`, до `children`. Боковой gutter несёт САМ лист
   * (`.headerOverlap`, `--sys-inset-page`) — ряд своего инсета НЕ добавляет,
   * поэтому `topContent` выровнен по левому краю с контентом ниже (списком,
   * NutrientsBar), а не сдвинут вглубь. Вертикаль и выравнивание (лево/центр/право,
   * in-flow vs `position:absolute`) задаёт САМ переданный элемент. Заменил прежний
   * центрированный `contentHeader` (2026-07-03).
   *
   * Когда задан `topContentRight`, `topContent` ужимается слева (flex: 1) и
   * освобождает справа квадратное место под правый слот + `gap` между ними.
   */
  topContent?: React.ReactNode;
  /**
   * Правый слот верхней строки листа — рядом с `topContent`, прижат вправо
   * (`flex-shrink: 0`). Обычно сюда едут квадратные кнопки-действия. Между ним
   * и `topContent` — `gap`; `topContent` ужимается ровно на ширину этого слота.
   * Без него `topContent` занимает всю ширину как раньше.
   */
  topContentRight?: React.ReactNode;
  /**
   * Лёгкое page-level действие в левом-верхнем углу листа. `position: absolute`
   * (см. `.headerAction`) — НЕ толкает центрированный hero вниз, плавает поверх
   * в углу; якорится к `.headerOverlap` (рассчитано на `headerOverlap`-режим).
   * Слева → не конфликтует с центрированным hero и watermark-логотипом справа.
   * Используют DishPage («Предложить ингредиенты») и ProductPage
   * («Предложить нутриенты») через общий `SuggestActionButton`.
   */
  headerAction?: React.ReactNode;
  backgroundColor?: 'gray' | 'white';
  className?: string;
  overlay?: React.ReactNode;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  /**
   * Samokat-style: children обёрнуты в opaque-белую плашку с
   * top-radius и `margin-top: -16px`, накрывающую низ `header`'а.
   * При скролле всей панели контент «всплывает» поверх хедера —
   * хедер уходит «под» контент. Без JS.
   */
  headerOverlap?: boolean;
  /**
   * Опциональный день недели слева в верхней «полке» листа (только
   * `headerOverlap`). Рендерится тихим `<QuietLabel>` (serif-italic). Несёт его
   * страница, у которой есть дата (Рацион → настоящий день из даты расписания);
   * экраны без даты не передают — полка остаётся с хватом + watermark.
   */
  sheetDateLabel?: React.ReactNode;
  /**
   * Overlay-режим нижнего бара: бар становится `position: absolute` над
   * контентом, а список скроллится ПОД ним (низ скроллера затухает маской,
   * чтобы строки растворялись под плавающей пилюлей без белой плашки).
   * `fixed` тут невозможен — слайды Embla двигаются `transform`'ом и несут
   * `contain: strict`, оба перехватывают containing-block у fixed-потомка.
   *
   * КАНОН (2026-06-08): по умолчанию `true` — плавающий бар стал общим
   * паттерном для ВСЕХ экранов с нижним баром (как HomePage screen 2), БЕЗ
   * гейта на пустоте (юзер выбрал «всегда плавает, для упрощения»). Эффект
   * включается ТОЛЬКО когда есть `bottomBar` (экраны без бара не получают ни
   * mask'у, ни нижний padding). Опт-аут `false` существует на крайний случай,
   * но сейчас им никто не пользуется — не плодить per-page гейты без причины.
   */
  bottomBarOverlay?: boolean;
  /**
   * Sticky-блок внутри `screenScroll`. Прилипает к `top: var(--top-bar-h, 0)`
   * (см. `.stickyTop` в CSS). Используется HomePage'ем чтобы класть
   * ScreenIndicator В ПОТОК каждого слайда — sticky резервирует место
   * естественно, контент идёт после без `padding-top`-компенсации,
   * клики ловятся самим элементом без invisible-overlay'ев.
   */
  stickyTop?: React.ReactNode;
  /**
   * Слот ПОСЛЕ листа `.headerOverlap` (и после `children` в non-overlap
   * режиме), но всё ещё ВНУТРИ скролл-рута `.screenScroll`. Контент уезжает
   * из-под опаковой плашки на фон страницы (ambient backdrop). Сюда едет
   * предложка (InlineWriteFoodReview): результат разбора плавает ПОД листом
   * со списком, рядом с write-баром (chat-pattern). Скроллится вместе с
   * контентом → auto-scroll по `[data-write-food-anchor]` продолжает работать.
   */
  afterContent?: React.ReactNode;
  /**
   * Включает направление-зависимое скрытие кнопок `HomeTopBar` при скролле
   * ВНУТРИ этого экрана. `settings` — уезжает только пилюля аккаунта; `all` —
   * аккаунт + нутриенты + дата (кнопка «Назад» не трогается). Работает только
   * при наличии `TopBarScrollHideContext.Provider` выше по дереву (страница со
   * `Swipeable`-баром); без провайдера — no-op, остальные страницы не задеты.
   * См. `topBarScrollHide`.
   */
  topBarHide?: TopBarHideTarget;
};

const Screen = ({
  header,
  children,
  bottomRight,
  bottomLeft,
  bottomBar,
  topContent,
  topContentRight,
  headerAction,
  actions,
  backgroundColor,
  className,
  overlay,
  backgroundImage,
  backgroundImageOpacity = 0.05,
  headerOverlap = false,
  sheetDateLabel,
  bottomBarOverlay = true,
  stickyTop,
  afterContent,
  topBarHide,
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { sentinelRef, hasMoreBelow } = useScrollBottomIndicator(scrollContainerRef);

  // Направление-зависимое скрытие кнопок бара (Headroom-канон). Активный экран
  // — тот, что реально скроллят; смена слайда сбрасывает бар через
  // `onIndexChange` страницы. Пишем в DOM через `setHide` (контекст), без
  // setState — свайп/скролл остаются zero-React-render. `setHide` стабилен
  // (useCallback в контроллере), `topBarHide` — строка → эффект вешается один раз.
  const hideApi = useContext(TopBarScrollHideContext);
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root || !topBarHide || !hideApi) return;
    const setHide = hideApi.setHide;
    // Гейт «только активный слайд»: уходящий слайд продолжает докручивать
    // инерцию ПОСЛЕ начала свайпа — без гейта его momentum-scroll перебивал бы
    // reset бара (`onIndexChange`) и бар мигал бы спрятанным на соседнем экране.
    // Активным считаем слайд, чей прямоугольник накрывает центр карусели —
    // чистая геометрия, без Embla API и без React-стейта (zero-render сохранён).
    // Маркеры ставит `Swipeable` (`data-embla-slide` / `data-carousel-container`);
    // вне карусели их нет → гейт выключен, поведение как раньше.
    const slideEl = root.closest('[data-embla-slide]');
    const viewport = root.closest('[data-carousel-container]');
    const isInactiveSlide = () => {
      if (!slideEl || !viewport) return false;
      const v = viewport.getBoundingClientRect();
      const s = slideEl.getBoundingClientRect();
      const center = v.left + v.width / 2;
      return center < s.left || center > s.right;
    };
    let lastY = root.scrollTop;
    let ticking = false;
    let rafId = 0;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(() => {
        ticking = false;
        const y = root.scrollTop;
        const dy = y - lastY;
        // Базовую позицию освежаем ВСЕГДА (даже когда слайд неактивен) — иначе
        // при возврате на экран первый dy посчитается от устаревшего lastY и
        // даст ложный скачок направления.
        lastY = y;
        if (isInactiveSlide()) return;
        if (y <= HIDE_REVEAL_TOP_PX) setHide('none');
        else if (dy > HIDE_DIR_THRESHOLD_PX) setHide(topBarHide);
        else if (dy < -HIDE_DIR_THRESHOLD_PX) setHide('none');
      });
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      // Снимаем висящий кадр — иначе он выстрелит setHide уже после отписки
      // (смена даты `key={date}` → remount, размонтаж страницы).
      cancelAnimationFrame(rafId);
    };
  }, [topBarHide, hideApi]);

  // Плавающий бар включается, только когда бар реально есть — иначе экран без
  // нижнего бара зря получил бы маску + нижний padding скроллера.
  const overlayActive = bottomBarOverlay && Boolean(bottomBar);

  // Верхняя строка листа: `topContent` (flex: 1, ужимается) + опциональный
  // квадратный `topContentRight` справа с `gap`. Рендерится один раз, вставляется
  // в обе ветки (headerOverlap / non-overlap).
  const topRow =
    topContent != null || topContentRight != null ? (
      <div className={styles.topRow}>
        {topContent != null && <div className={styles.topContent}>{topContent}</div>}
        {topContentRight != null && (
          <div className={styles.topContentRight}>{topContentRight}</div>
        )}
      </div>
    ) : null;

  return (
    <div
      className={clsx(
        styles.screen,
        backgroundColor && styles[`bg-${backgroundColor}`],
        overlayActive && styles.screenBottomOverlay,
        className
      )}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          className={styles.backgroundImage}
          style={{ opacity: backgroundImageOpacity }}
          alt=""
        />
      )}
      <div className={styles.scrollWrap}>
        <div className={styles.screenScroll} ref={scrollContainerRef}>
          {stickyTop && <div className={styles.stickyTop}>{stickyTop}</div>}
          {header}
          {headerOverlap ? (
            <div className={styles.headerOverlap}>
              {/* Полка листа: хват-пилюля (всегда) + день недели слева (когда
                  страница его дала). Декоративна → aria-hidden (дату уже
                  озвучивает HomeTopBar). Watermark Disher справа рисует сам лист
                  через `.headerOverlap::after`. */}
              <div className={styles.sheetBand} aria-hidden="true">
                {sheetDateLabel != null && (
                  <QuietLabel className={styles.sheetBandDay}>{sheetDateLabel}</QuietLabel>
                )}
                <span className={styles.sheetGrabber} />
              </div>
              {headerAction && <div className={styles.headerAction}>{headerAction}</div>}
              {topRow}
              {children}
            </div>
          ) : (
            <>
              {headerAction && <div className={styles.headerAction}>{headerAction}</div>}
              {topRow}
              {children}
            </>
          )}
          {/* Слот ПОСЛЕ листа `.headerOverlap` — контент на фоне страницы под
              плашкой (см. `afterContent` в Props). Несёт предложку. */}
          {afterContent}
          <div ref={sentinelRef} />
        </div>
        <ScrollIndicator visible={hasMoreBelow && !overlayActive} />
      </div>

      {bottomBar && <div className={styles.bottomBar}>{bottomBar}</div>}

      {bottomLeft && <div className={styles.bottomLeft}>{bottomLeft}</div>}

      {bottomRight && <div className={styles.bottomRight}>{bottomRight}</div>}

      {actions && <div className={styles.actions}>{actions}</div>}

      {overlay}
    </div>
  );
};

export default memo(Screen);
