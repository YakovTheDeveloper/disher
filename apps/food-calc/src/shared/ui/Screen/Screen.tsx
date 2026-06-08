import styles from './Screen.module.scss';
import clsx from 'clsx';
import { useRef, useEffect, memo } from 'react';
import { useScrollBottomIndicator } from '@/hooks/useScrollBottomIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';

// Фолбэк высоты absolute-бара, если `--top-bar-h` не резолвится.
const TOP_BAR_FALLBACK_PX = 80;

type Props = {
  children: React.ReactNode;
  actions?: React.ReactNode;
  bottomRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomBar?: React.ReactNode;
  header?: React.ReactNode;
  /**
   * Семантический заголовок контента — день недели (FoodSchedule) или имя
   * блюда/продукта (Dish/Product). Рендерится первым ВНУТРИ листа
   * (`headerOverlap`), по центру, как `<Heading size="section">` (канон —
   * заголовок дня на HomePage). Маленький watermark-логотип справа от него
   * рисует `.contentHeader::after` и гаснет на пустом экране (`hollow`) —
   * там вместо него включается большой центральный логотип в `.scrollWrap`.
   */
  contentHeader?: React.ReactNode;
  /** Доп. класс на обёртку `contentHeader` (page-specific тюнинг). */
  contentHeaderClassName?: string;
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
   * Когда `true` — visual `.headerOverlap` «лист» становится прозрачным
   * и теряет тень. Использовать для пустых экранов (нет событий → нет
   * «листа»). Триггер через `data-hollow` атрибут, чтобы стили жили в CSS.
   */
  hollow?: boolean;
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
   * Эмитит видимость элемента `contentHeader` относительно своего скролл-рута
   * (IntersectionObserver, тот же идиом, что `useScrollBottomIndicator`).
   * Деталь-страницы используют, чтобы вернуть имя в `HomeTopBar.centerLabel`
   * РОВНО когда заголовок уехал под бар. Колбэк должен быть СТАБИЛЬНЫМ
   * (`useCallback`) — иначе пере-подписка наблюдателя каждый рендер.
   */
  onContentHeaderVisibilityChange?: (visible: boolean) => void;
};

const Screen = ({
  header,
  children,
  bottomRight,
  bottomLeft,
  bottomBar,
  contentHeader,
  contentHeaderClassName,
  headerAction,
  actions,
  backgroundColor,
  className,
  overlay,
  backgroundImage,
  backgroundImageOpacity = 0.05,
  headerOverlap = false,
  hollow = false,
  bottomBarOverlay = true,
  stickyTop,
  afterContent,
  onContentHeaderVisibilityChange,
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { sentinelRef, hasMoreBelow } = useScrollBottomIndicator(scrollContainerRef);

  // Плавающий бар включается, только когда бар реально есть — иначе экран без
  // нижнего бара зря получил бы маску + нижний padding скроллера.
  const overlayActive = bottomBarOverlay && Boolean(bottomBar);

  // Наблюдаем реальный элемент заголовка (`contentHeader`) против собственного
  // скролл-рута. Эмитим булеву видимость наружу — страница флипает
  // `HomeTopBar.centerLabel` ровно на пересечении, без per-frame setState.
  const contentHeaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scrollContainerRef.current;
    const el = contentHeaderRef.current;
    if (!root || !el || !onContentHeaderVisibilityChange) return;
    // Высота бара = `--top-bar-h` (= calc(env(safe-area-inset-top) + 80px)).
    // env()/calc нельзя положить строкой в rootMargin, поэтому резолвим в px
    // через временный probe — иначе на notched-устройствах (safe-area > 0) имя
    // в хедере «проваливалось» бы на полосе высотой safe-area.
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--top-bar-h,80px);';
    root.appendChild(probe);
    const barH = probe.offsetHeight || TOP_BAR_FALLBACK_PX;
    root.removeChild(probe);
    const io = new IntersectionObserver(
      ([entry]) => onContentHeaderVisibilityChange(entry.isIntersecting),
      { root, threshold: 0, rootMargin: `-${barH}px 0px 0px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onContentHeaderVisibilityChange]);

  return (
    <div
      className={clsx(
        styles.screen,
        backgroundColor && styles[`bg-${backgroundColor}`],
        overlayActive && styles.screenBottomOverlay,
        className,
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
      <div className={styles.scrollWrap} data-hollow={hollow ? 'true' : undefined}>
        {/* Большой бледный логотип Disher по центру — фон-слой ПОД контентом.
            Виден только на пустом экране (`[data-hollow]`); когда есть контент,
            непрозрачный лист накрывает его, а справа от заголовка проступает
            маленький watermark (`.contentHeader::after`). */}
        <span className={styles.brandWatermark} aria-hidden="true" />
        <div className={styles.screenScroll} ref={scrollContainerRef}>
          {stickyTop && <div className={styles.stickyTop}>{stickyTop}</div>}
          <div className={styles.topSpacer} aria-hidden="true" />
          {header}
          {headerOverlap ? (
            <div className={styles.headerOverlap} data-hollow={hollow ? 'true' : undefined}>
              {headerAction && <div className={styles.headerAction}>{headerAction}</div>}
              {contentHeader != null && (
                <div ref={contentHeaderRef} className={clsx(styles.contentHeader, contentHeaderClassName)}>
                  {contentHeader}
                </div>
              )}
              {children}
            </div>
          ) : (
            <>
              {headerAction && <div className={styles.headerAction}>{headerAction}</div>}
              {contentHeader != null && (
                <div ref={contentHeaderRef} className={clsx(styles.contentHeader, contentHeaderClassName)}>
                  {contentHeader}
                </div>
              )}
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
