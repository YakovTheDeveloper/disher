import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import { Heading, QuietLabel } from '@/shared/ui/atoms/Typography';
import s from './SwitcherTab.module.scss';

// Стрелка-указатель направления НАРИСОВАНА в CSS (тонкий стержень + головка, см.
// SwitcherTab.module.scss `.tileArrow*`) — НЕ шрифтовой глиф. Глиф ⟵/⟶ выпадал в
// системный фолбэк (Source Serif этих кодпойнтов не содержит) и терял serif-наклон
// + плыл по платформам; CSS-стрелка одинакова везде и подстраивается под voice.
// JSX рендерит лишь пустой span-носитель направления; всю форму держит CSS.

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
   * Направленная CSS-стрелка у неактивной подписи — указывает, с какой стороны
   * лежит её экран (`left` ← слева от слова / `right` → справа). Аффорданс
   * «разделы листаются» живёт на самих табах. У активного таба не рендерится;
   * показ у неактивных решает ScreenIndicator (`arrowHint`: по дефолту у всех,
   * либо одна правая стрелка на серединном слайде — `middle-right`).
   */
  arrow?: 'left' | 'right';
  /** Типо-ярус подписи активного таба (`<Heading role>`). Дефолт `display`
   *  (46px masthead). Переключатели внутри оверлея просят меньший (`headline`). */
  titleRole?: 'display' | 'headline' | 'title';
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
  titleRole = 'display',
  className,
  onClick,
  ...rest
}: SwitcherTabProps) => (
  <button
    type="button"
    {...rest}
    // Активный таб полностью инертен — ты уже на нём (юзер-канон 2026-07-03). onClick
    // не шлём (клавиатурный Enter → no-op), клик/press глушит `pointer-events:none`
    // в `.tileActive`, а tabIndex=-1 убирает его и из tab-order (нельзя сфокусировать
    // клавиатурой «мёртвый» таб — юзер выбрал так явно). Идут ПОСЛЕ `{...rest}`, чтобы
    // перекрыть caller-значения. aria-current сюда НЕ навешиваем: selected-состояние
    // уже несёт `aria-selected` потребителя (ScreenIndicator = role="tab"/"tablist").
    className={clsx(s.tile, active && s.tileActive, solidLabel && s.tileSolidLabel, className)}
    onClick={active ? undefined : onClick}
    tabIndex={active ? -1 : rest.tabIndex}
  >
    {image && <img src={image} className={s.tileImg} alt="" aria-hidden />}
    {active ? (
      <Heading as="span" role={titleRole} className={s.tileTitle}>
        {label}
      </Heading>
    ) : (
      <QuietLabel as="span" underline className={s.tileTitle}>
        {/* Левая стрелка идёт В ПОТОКЕ перед словом — её левый край встаёт на рельсу
            (ровно под активным заголовком), слово сдвигается вправо. Правая — в потоке
            после слова. Носители пустые — форму стрелки рисует CSS (.tileArrow*). */}
        {arrow === 'left' && <span className={s.tileArrowLead} aria-hidden="true" />}
        {label}
        {arrow === 'right' && <span className={s.tileArrowTrail} aria-hidden="true" />}
      </QuietLabel>
    )}
  </button>
);

export default SwitcherTab;
