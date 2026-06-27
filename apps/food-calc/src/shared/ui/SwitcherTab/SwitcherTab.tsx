import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import { Heading, QuietLabel } from '@/shared/ui/atoms/Typography';
import s from './SwitcherTab.module.scss';

// Угловая кавычка (guillemet) как указатель направления. Не иконка, а ГЛИФ той же
// Source Serif italic, что и подпись — одинаковая модуляция штриха + наклон, один
// материал с QuietLabel (геометрический stroke-шеврон выбивался из serif-вайба).
const GUILLEMET = { left: '‹', right: '›' } as const;

export type SwitcherTabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Подпись таба. */
  label: string;
  /** Фоновая картинка-призрак (приглушённая), опционально. */
  image?: string;
  /** Активный таб — подпись = заголовок (Heading); иначе тихий указатель (Text). */
  active?: boolean;
  /** Подпись остаётся чёрной и непрозрачной даже у active-плитки. */
  solidLabel?: boolean;
  /**
   * Направленный шеврон у неактивной подписи — указывает, с какой стороны лежит
   * её экран (`left` ‹ / `right` ›). Аффорданс «разделы листаются» переезжает на
   * сами табы (см. ScreenIndicator `tab-arrows`). У активного таба не рендерится.
   */
  arrow?: 'left' | 'right';
};

/**
 * SwitcherTab — таб-переключатель экранов HomePage-ряда (`ScreenIndicator`): фоновая
 * картинка-призрак + подпись. Голос подписи берётся ПРЯМО из примитива по
 * состоянию: активный = `<Heading>` (display bold-sans), неактивный =
 * `<QuietLabel>` (тихий serif-указатель). Раскладку ряда (на своей
 * строке / в ряд / центр) задают `data-dv`-варианты `NavSwitcher` ТОЛЬКО
 * через layout — типографику они не трогают. Размер активного заголовка
 * вариант может переопределить (`font-size` на `.tileActive .tileTitle`).
 *
 * Положение картинки-призрака настраивается CSS-переменными — через
 * `style` или `className` потребителя (composite-only сдвиг/масштаб):
 *   --tile-img-x       сдвиг по горизонтали, + вправо   (default 0px)
 *   --tile-img-y       сдвиг по вертикали,  + вниз       (default 10px)
 *   --tile-img-scale   масштаб, >1 — плотнее обрезка     (default 1)
 *   --tile-img-opacity прозрачность                     (default 0.07)
 */
export const SwitcherTab = ({
  label,
  image,
  active,
  solidLabel,
  arrow,
  className,
  ...rest
}: SwitcherTabProps) => (
  <button
    type="button"
    className={clsx(s.tile, active && s.tileActive, solidLabel && s.tileSolidLabel, className)}
    {...rest}
  >
    {image && <img src={image} className={s.tileImg} alt="" aria-hidden />}
    {active ? (
      <Heading as="span" role="display" className={s.tileTitle}>
        {label}
      </Heading>
    ) : (
      <QuietLabel as="span" className={s.tileTitle}>
        {/* Левый guillemet СВЕШИВАЕТСЯ в поле (hanging punctuation) — слово остаётся
            выровнено с активным заголовком. Правый идёт в потоке после слова. */}
        {arrow === 'left' && (
          <span className={s.tileArrowLead} aria-hidden="true">
            {GUILLEMET.left}
          </span>
        )}
        {label}
        {arrow === 'right' && (
          <span className={s.tileArrowTrail} aria-hidden="true">
            {GUILLEMET.right}
          </span>
        )}
      </QuietLabel>
    )}
  </button>
);

export default SwitcherTab;
