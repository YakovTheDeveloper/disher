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
  topPanel?: React.ReactNode;
  header?: React.ReactNode;
  title?: React.ReactNode;
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
   * Когда `true` — нижний бар получает «лист»-подложку (белый bg, скругления
   * сверху, мягкая тень). Парный приём к `hollow`: на пустом экране «лист»
   * уходит из-под контента и проявляется под нижним баром. Триггер через
   * `data-sheet` атрибут. НЕ завязан на `hollow` — это отдельный визуальный
   * переключатель (hollow используют и Product/Dish, где нижний лист не нужен).
   */
  bottomBarSheet?: boolean;
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
   * Hero-блок ПОД `stickyTop` (не sticky, regular flow). Тайлы остаются
   * вверху прилипшими, hero (имя страницы) стартует ниже их и при скролле
   * уезжает вверх. Используется страницами блюда/продукта; HomePage hero
   * не задаёт.
   */
  heroTop?: React.ReactNode;
  /**
   * Опциональная подпись под `heroTop` (имя текущего тайла, 20px italic).
   * Заменяет старый `ScreenIndicator.band` для страниц блюда/продукта
   * (там индикатор рендерится с `hideBand=true`). Стилизуется внутри
   * Screen — страницам не надо знать про класс.
   */
  heroSubLabel?: React.ReactNode;
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
  topPanel,
  actions,
  backgroundColor,
  className,
  overlay,
  backgroundImage,
  backgroundImageOpacity = 0.05,
  headerOverlap = false,
  hollow = false,
  bottomBarSheet = false,
  bottomBarOverlay = false,
  stickyTop,
  heroTop,
  heroSubLabel,
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
      <div className={styles.scrollWrap}>
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
          {(heroTop || heroSubLabel) && (
            <div className={styles.heroTop}>
              {heroTop}
              {heroSubLabel && (
                <div className={styles.heroSubLabel}>{heroSubLabel}</div>
              )}
            </div>
          )}
          <div className={styles.topPanel}>{topPanel}</div>
          {header}
          {headerOverlap ? (
            <div className={styles.headerOverlap} data-hollow={hollow ? 'true' : undefined}>
              {children}
            </div>
          ) : (
            children
          )}
          <div ref={sentinelRef} />
        </div>
        <ScrollIndicator visible={hasMoreBelow && !bottomBarOverlay} />
      </div>

      {bottomBar && (
        <div className={styles.bottomBar} data-sheet={bottomBarSheet ? 'true' : undefined}>
          {bottomBar}
        </div>
      )}

      {bottomLeft && <div className={styles.bottomLeft}>{bottomLeft}</div>}

      {bottomRight && <div className={styles.bottomRight}>{bottomRight}</div>}

      {actions && <div className={styles.actions}>{actions}</div>}

      {overlay}
    </div>
  );
};

export default memo(Screen);
