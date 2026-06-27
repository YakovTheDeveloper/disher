import type { ReactNode } from 'react';
import { SwitcherTab } from '@/shared/ui/SwitcherTab';
import s from './ScreenIndicator.module.scss';

export type TileTitleStyle = 'serif-initial' | 'display-sans' | 'mono-track';

// Аффорданс «листаемые разделы» живёт на самих табах: у неактивной подписи
// стрелка-указатель (нарисована в CSS, см. SwitcherTab) в сторону её экрана
// (← слева / → справа) — знакомит юзера с тем, что разделы свайпаются. По
// умолчанию (`arrowHint='all'`) стрелка у КАЖДОГО неактивного таба; HomePage
// ставит `arrowHint='middle-right'` — одна правая стрелка на серединном слайде
// (см. проп). Отдельного ряда-индикатора (легаси I · II · III) больше нет.

export type ScreenEntry = {
  label: string;
  image?: string;
  titleStyle?: TileTitleStyle;
};

type Props = {
  screens: ScreenEntry[];
  onSelect: (index: number) => void;
  // Один из двух режимов выбора отображаемого экрана:
  // - slideIndex задан → индикатор статично показывает СВОЙ экран
  //   (label/image/highlight). Используется в HomePage, где каждый слайд
  //   Swipeable рендерит свой инстанс; title не прыгает при перелистывании
  //   и Page не зависит от активного индекса (ноль ре-рендеров на свайпе).
  // - slideIndex не задан → fallback на activeIndex (legacy: DishBuilderPage,
  //   один инстанс на странице).
  activeIndex?: number;
  slideIndex?: number;
  // Опциональный слот под тайлами — заголовок контента страницы (например,
  // `<Heading role="headline">`). Типографику задаёт сам переданный узел, не
  // band. Не задан → band не рендерится (дефолт для product/dish; HomePage
  // тоже не передаёт — шапку слайда несёт `<Heading masthead>` внутри листа).
  title?: ReactNode;
  // Бледная картинка активного экрана (`.bandImg`), прижатая к верху индикатора.
  // Дефолт — true (product/dish так и показывают). HomePage передаёт false:
  // там картинка таба переехала в центр слайда (SlideArtFrame), и второй
  // верхний экземпляр был бы дублем.
  bandImg?: boolean;
  // Accessible name for the role="tablist". Default «Экран» (slide switcher on
  // Home/Dish). Surfaces that reuse this as a content tab-switcher pass a
  // meaningful label (e.g. /discoveries → «Открытия: раздел»).
  tablistLabel?: string;
  // Поведение стрелок-указателей у неактивных табов:
  //  - 'all' (дефолт): стрелка у КАЖДОГО неактивного, в сторону его экрана
  //    (левее активного → ←, правее → →). Прочие деки (Блюдо/Открытия/навигатор).
  //  - 'middle-right': только когда активен серединный слайд И только ПРАВАЯ
  //    (вперёд) стрелка. Ставит ТОЛЬКО HomePage (по запросу: один указатель
  //    «листай дальше» справа от средней «Рацион»). Через проп, а не глобально:
  //    у 2-плиточных деков середины нет → остались бы без стрелок.
  arrowHint?: 'all' | 'middle-right';
};

export const ScreenIndicator = ({
  screens,
  activeIndex,
  onSelect,
  slideIndex,
  title,
  bandImg = true,
  tablistLabel = 'Экран',
  arrowHint = 'all',
}: Props) => {
  const displayIndex = slideIndex ?? activeIndex ?? 0;
  const activeScreen = screens[displayIndex];
  const activeLabel = activeScreen?.label ?? '';
  const activeImage = activeScreen?.image;
  const total = screens.length;
  // Анти-гигантизм для коротких индикаторов: ≤2 плиток раскладываются в
  // 3-колоночную сетку (каждая = 1/3 ширины, квадрат → и по высоте меньше) и
  // прижимаются к ПРАВОМУ краю — пустая колонка слева. 3+ плиток (Home/Dish)
  // занимают всю ширину как раньше (slots === total, offset 0).
  const slots = Math.max(total, 3);
  const colOffset = slots - total;

  return (
    <div
      className={s.root}
      data-screen={displayIndex}
      style={{
        ['--active-idx' as string]: displayIndex,
        ['--tiles-total' as string]: total,
        ['--tiles-slots' as string]: slots,
      }}
    >
      {bandImg && activeImage && (
        <img
          key={activeImage}
          src={activeImage}
          className={s.bandImg}
          alt=""
          aria-hidden
          decoding="async"
        />
      )}
      <div className={s.tilesRow} role="tablist" aria-label={tablistLabel}>
        {screens.map((screen, i) => {
          const isActive = screen.label === activeLabel;
          // Стрелка-указатель неактивного таба смотрит в сторону его экрана.
          // 'all' (дефолт): левее активного → 'left', правее → 'right'.
          // 'middle-right' (HomePage): только на серединном слайде и только у
          // соседа справа (вперёд) → одна правая стрелка; левый сосед без стрелки.
          const onMiddleSlide = displayIndex > 0 && displayIndex < total - 1;
          let arrow: 'left' | 'right' | undefined;
          if (isActive) {
            arrow = undefined;
          } else if (arrowHint === 'middle-right') {
            arrow = onMiddleSlide && i > displayIndex ? 'right' : undefined;
          } else {
            arrow = i < displayIndex ? 'left' : 'right';
          }
          return (
            <SwitcherTab
              key={screen.label}
              role="tab"
              aria-selected={isActive}
              label={screen.label}
              image={screen.image}
              active={isActive}
              arrow={arrow}
              style={{ gridColumnStart: i + 1 + colOffset }}
              onClick={() => onSelect(i)}
            />
          );
        })}
      </div>

      {title != null && <div className={s.band}>{title}</div>}
    </div>
  );
};

export default ScreenIndicator;
