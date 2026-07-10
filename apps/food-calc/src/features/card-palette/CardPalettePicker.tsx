import { useEffect } from 'react';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import { Text } from '@/shared/ui/atoms/Typography';
import {
  CARD_PALETTES,
  CARD_PALETTE_LABELS,
  CARD_SURFACES,
  CARD_SURFACE_LABELS,
  useCardPaletteStore,
  type CardPalette,
  type CardSurface,
} from '@/shared/lib/cardPalette';
import styles from './CardPalettePicker.module.scss';

// Пер-поверхностный выбор цвета карточек (настройки → «Цвет карточек»). Одна
// группа свотчей на поверхность (еда расписания / события / ингредиенты блюда).
// Свотч читает цвет из общего card-palette-set через `data-dv-v` (DRY с боевыми
// правилами палитр — см. CardPalettePicker.module.scss). Дефолт amber.
//
// Раскладка — Embla-слайдер: свотчи идут столбиками по 2 (пара = один слайд),
// строй прокручивается горизонтально со снапом по колонкам. Движок тот же, что
// во всём приложении (Swipeable / ScheduleNavigator).

// Свотчи бьются на колонки по 2 — каждая пара = один Embla-слайд.
const COLUMN_SIZE = 2;
const chunk = <T,>(arr: readonly T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};
const PALETTE_COLUMNS = chunk(CARD_PALETTES, COLUMN_SIZE);

const Swatch = ({
  palette,
  isActive,
  onSelect,
}: {
  palette: CardPalette;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={isActive}
    aria-label={CARD_PALETTE_LABELS[palette]}
    data-dv-v={palette}
    className={clsx(styles.swatch, isActive && styles.active)}
    onClick={onSelect}
  >
    <span className={styles.preview} aria-hidden />
    <span className={styles.tick} aria-hidden>
      <TickIcon />
    </span>
    <Text as="span" role="caption" className={styles.label}>
      {CARD_PALETTE_LABELS[palette]}
    </Text>
  </button>
);

const SurfaceRow = ({ surface }: { surface: CardSurface }) => {
  const palette = useCardPaletteStore((s) => s.palettes[surface]);
  const setPalette = useCardPaletteStore((s) => s.setPalette);

  // Слайдер = Embla (тот же движок, что во всём приложении). `.viewport` =
  // Embla-root (overflow hidden), `.track` = Embla-container (flex-ряд колонок).
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'x',
    loop: false,
    containScroll: 'trimSnaps',
    dragFree: true,
    watchResize: true,
  });

  // Дровер (ProfileDrawer) въезжает анимацией — на первом кадре Embla может снять
  // кривую ширину слайда. Переснимаем после первого paint'а (тот же rAF-reInit,
  // что в ScheduleNavigator / Swipeable).
  useEffect(() => {
    if (!emblaApi) return;
    const id = requestAnimationFrame(() => emblaApi.reInit());
    return () => cancelAnimationFrame(id);
  }, [emblaApi]);

  return (
    <div className={styles.group}>
      <Text as="span" role="label" className={styles.groupLabel}>
        {CARD_SURFACE_LABELS[surface]}
      </Text>
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.track} role="radiogroup" aria-label={CARD_SURFACE_LABELS[surface]}>
          {PALETTE_COLUMNS.map((column, i) => (
            <div key={i} className={styles.column}>
              {column.map((p) => (
                <Swatch
                  key={p}
                  palette={p}
                  isActive={p === palette}
                  onSelect={() => setPalette(surface, p)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CardPalettePicker = () => (
  <div className={styles.root}>
    {CARD_SURFACES.map((surface) => (
      <SurfaceRow key={surface} surface={surface} />
    ))}
  </div>
);

export default CardPalettePicker;
