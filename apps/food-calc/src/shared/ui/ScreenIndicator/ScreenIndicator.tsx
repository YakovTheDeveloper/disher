import type { ReactNode } from 'react';
import clsx from 'clsx';
import { SwitcherTab } from '@/shared/ui/SwitcherTab';
import s from './ScreenIndicator.module.scss';

export type TileTitleStyle = 'serif-initial' | 'display-sans' | 'mono-track';

// Номера таблиц для индикатора-варианта `tab-numerals` (см. .swipeDot::before).
const PLATE_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

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
};

export const ScreenIndicator = ({
  screens,
  activeIndex,
  onSelect,
  slideIndex,
  title,
  bandImg = true,
  tablistLabel = 'Экран',
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
        {screens.map((screen, i) => (
          <SwitcherTab
            key={screen.label}
            role="tab"
            aria-selected={screen.label === activeLabel}
            label={screen.label}
            image={screen.image}
            active={screen.label === activeLabel}
            style={{ gridColumnStart: i + 1 + colOffset }}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>

      {/* Индикатор-точки «листаемые разделы». Рендерится всегда (дёшево), но
          по умолчанию display:none — показывается только в NavSwitcher-вариантах,
          где ряд табов превратился в крупный заголовок и нужен явный сигнал
          «свайпай между разделами» (см. .swipeDots в ScreenIndicator.module.scss). */}
      <div className={s.swipeDots} aria-hidden="true">
        {screens.map((screen, i) => (
          <span
            key={screen.label}
            className={clsx(s.swipeDot, i === displayIndex && s.swipeDotActive)}
            data-num={PLATE_NUMERALS[i] ?? String(i + 1)}
          />
        ))}
      </div>

      {title != null && <div className={s.band}>{title}</div>}
    </div>
  );
};

export default ScreenIndicator;
