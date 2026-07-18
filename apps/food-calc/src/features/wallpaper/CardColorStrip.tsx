import clsx from 'clsx';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import {
  CARD_PALETTES,
  CARD_PALETTE_LABELS,
  useCardPaletteStore,
  type CardPalette,
  type CardSurface,
} from '@/shared/lib/cardPalette';
import s from './CardColorStrip.module.scss';

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
    className={clsx(s.swatch, isActive && s.active)}
    onClick={onSelect}
  >
    {/* Превью читает --tod-* своего форка палитры (data-dv-v) — DRY с боевыми
        правилами card-palette-set (тот же приём, что в CardPalettePicker). */}
    <span className={s.preview} aria-hidden />
    <span className={s.tick} aria-hidden>
      <TickIcon />
    </span>
  </button>
);

/**
 * CardColorStrip — ГОРИЗОНТАЛЬНАЯ прокручиваемая лента цвета карточек одной
 * поверхности. Стоит в WallpaperDrawer под слайдером высоты, в самом низу секции.
 *
 * Скролл — НАТИВНЫЙ (`overflow-x:auto`), не Embla: CSS-скролл проще и подхватывает
 * ширину без reInit. Плитки — короткие (высота вдвое меньше квадрата), 4+ видно в
 * ряду, остальные уходят вбок.
 *
 * Пишет/читает общий `useCardPaletteStore` (shared/lib) — без импорта фичи
 * card-palette. Свотч без подписи (узко) — идентичность несёт цвет + галочка.
 */
export const CardColorStrip = ({
  surface,
  className,
}: {
  surface: CardSurface;
  className?: string;
}) => {
  const palette = useCardPaletteStore((st) => st.palettes[surface]);
  const setPalette = useCardPaletteStore((st) => st.setPalette);

  return (
    <div className={clsx(s.frame, className)}>
      <div
        className={s.viewport}
        role="radiogroup"
        aria-label="Цвет карточек секции"
        // Драг по ленте (горизонтальный скролл) не должен уводиться в swipe-close дровера.
        data-base-ui-swipe-ignore
      >
        {CARD_PALETTES.map((p) => (
          <Swatch
            key={p}
            palette={p}
            isActive={p === palette}
            onSelect={() => setPalette(surface, p)}
          />
        ))}
      </div>
    </div>
  );
};

export default CardColorStrip;
