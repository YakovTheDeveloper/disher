import styles from './Screen.module.scss';
import clsx from 'clsx';
import { useRef, memo } from 'react';
import { useScrollBottomIndicator } from '@/hooks/useScrollBottomIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';

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
   * Используется HomePage (write-dock). Прочие страницы не задают — остаётся
   * integrated-dock (бар в потоке, список кончается над ним).
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
   * Эмитит `scrollTop` контейнера на каждом scroll-событии (passive listener
   * через JSX `onScroll`). Страница использует чтобы при `y > N` вернуть
   * имя блюда/продукта в `HomeTopBar.centerLabel`.
   */
  onScrollY?: (y: number) => void;
};

const Screen = ({
  header,
  children,
  bottomRight,
  bottomLeft,
  bottomBar,
  contentHeader,
  contentHeaderClassName,
  actions,
  backgroundColor,
  className,
  overlay,
  backgroundImage,
  backgroundImageOpacity = 0.05,
  headerOverlap = false,
  hollow = false,
  bottomBarOverlay = false,
  stickyTop,
  onScrollY,
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { sentinelRef, hasMoreBelow } = useScrollBottomIndicator(scrollContainerRef);

  return (
    <div
      className={clsx(
        styles.screen,
        backgroundColor && styles[`bg-${backgroundColor}`],
        bottomBarOverlay && styles.screenBottomOverlay,
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
        <div
          className={styles.screenScroll}
          ref={scrollContainerRef}
          onScroll={
            onScrollY
              ? (e) => onScrollY((e.currentTarget as HTMLDivElement).scrollTop)
              : undefined
          }
        >
          {stickyTop && <div className={styles.stickyTop}>{stickyTop}</div>}
          <div className={styles.topSpacer} aria-hidden="true" />
          {header}
          {headerOverlap ? (
            <div className={styles.headerOverlap} data-hollow={hollow ? 'true' : undefined}>
              {contentHeader != null && (
                <div className={clsx(styles.contentHeader, contentHeaderClassName)}>
                  {contentHeader}
                </div>
              )}
              {children}
            </div>
          ) : (
            <>
              {contentHeader != null && (
                <div className={clsx(styles.contentHeader, contentHeaderClassName)}>
                  {contentHeader}
                </div>
              )}
              {children}
            </>
          )}
          <div ref={sentinelRef} />
        </div>
        <ScrollIndicator visible={hasMoreBelow && !bottomBarOverlay} />
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
