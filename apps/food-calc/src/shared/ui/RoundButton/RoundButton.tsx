import { useId, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import s from './RoundButton.module.scss';

export interface RoundButtonProps {
  /**
   * Focuses this input id on tap (ModalByLabel idiom) — opens the linked overlay,
   * rendering the medal as a `<label htmlFor>` (focus delegation). OMIT it to get a
   * plain `<button type="button" onClick>` for standalone use (quick-nav anchors,
   * any tap that isn't wired to a hidden input).
   */
  htmlFor?: string;
  ariaLabel: string;
  /**
   * Tap side-effect. In label-mode it fires ALONGSIDE the native `<label htmlFor>`
   * focus delegation — use it to stash draft state BEFORE `onFocusCapture` flips
   * the step (never call setStep here — that would unmount the label mid-click and
   * swallow the focus delegation; see CLAUDE.md «Label focus delegation»). In
   * button-mode (no `htmlFor`) it's the primary action.
   */
  onClick?: () => void;
  /** Center engraving as a raster png (Food bar). */
  img?: string;
  /** Override the center `img` width (CSS length, e.g. `'100%'`). Default 60%. */
  imgWidth?: string;
  /** Horizontal nudge for the center `img` (CSS length; negative = left). Default 0. */
  imgNudgeX?: string;
  /** Vertical nudge for the center `img` (CSS length; negative = up). Default 0. */
  imgNudgeY?: string;
  /** Center glyph as a node (e.g. an icon) — alternative to `img` (Analysis bar). */
  centerNode?: ReactNode;
  /** Upper arc caption. */
  arcTop?: string;
  /** Lower arc caption. */
  arcBottom?: string;
  /**
   * Тихий шеврон › на ПРАВОМ краю медали, по вертикали в центре — affordance
   * «откроет / следующий шаг» (FAB «Новая еда» в поиске). Наследует цвет глифа
   * медали (on-floating на elevated → белый).
   */
  sideChevron?: boolean;
  /** Quiet/dimmed state (Food ready-state): no lift shadow + faded. */
  dimmed?: boolean;
  /** Nudge the coin up a touch above the pill centre (Food bar — «приподнятая» кнопка). */
  lifted?: boolean;
  /**
   * Float over the pill's right edge (default, absolute anchor to `[data-write-bar]`)
   * vs sit IN FLOW (set `false`) — e.g. inside a tall bar's trailing slot, where it
   * reserves its own width and never collapses on focus. Standalone button-mode use
   * passes `false` too (there is no pill to float over).
   */
  floating?: boolean;
  /**
   * Режим медали — как она стоит относительно поверхности:
   *   • `flat` (default) — «часть панели»: «лист над листом» (surface-2 / surface-0)
   *     + тонкий бордер, плоская. Край на одноцветной плашке определяет бордер
   *     (Food-бар на HomePage, в потоке дока).
   *   • `elevated` — «висит в воздухе»: sys-elevation важного объекта
   *     (`--sys-elevation-action-raised`) БЕЗ бордер-обводки + яркий холодный текст
   *     дуг (`--sys-color-text-cold-strong`). Парящий FAB «Новая еда» в поиске.
   *   • `raised` — приподнятая СВЕТЛАЯ плитка: сплошной surface-2 диск + мягкая lift-
   *     тень (`--sys-elevation-action-rest`), БЕЗ канта; press компрессует тень. Round-
   *     инстанс паттерна «вдавленный лоток Well + приподнятые surface-2 плитки» (ряд
   *     правок ItemActionsDrawer). В отличие от `elevated` (ТЁМНАЯ монета-акцент) —
   *     светлый диск, всплывающий из холодной канавки Well.
   * Раньше называлось `coin`/`paper`; развели на семантические режимы 2026-07-10.
   */
  look?: 'elevated' | 'flat' | 'raised';
  /**
   * Снимает плашку-подложку медали (фон + кольца-тени + внутренний диск `::before`),
   * оставляя ТОЛЬКО картинку/глиф + дугу на голой поверхности. Press-ink `::after`
   * остаётся — даёт кружок-отклик даже без покоящегося диска. Медаль «Новое событие».
   */
  plateless?: boolean;
  /**
   * Тень-подъём под медалью (`--sys-elevation-action-rest`) — читается «приподнятой»
   * даже без плашки. Совместимо с `plateless`: бьёт его `box-shadow:none`. Медаль «Новое событие».
   */
  shadow?: boolean;
  /**
   * Тонкая круговая обводка по краю медали (`--sys-color-border-default` — та же
   * линия, что окантовывает flat-медаль «Список еды»). Даёт краю плейтлесс-монеты
   * форму. Медаль «Новое событие».
   */
  outlined?: boolean;
}

/**
 * Round coin/stamp affordance: a medal — center glyph + two arc captions. Renders
 * as a `<label htmlFor>` when `htmlFor` is given (focus delegation opens the linked
 * manager/catalog; used by the WriteBarShell pills + ModalByLabel edit rows) or as
 * a plain `<button onClick>` when it isn't (standalone quick actions). Extracted
 * 2026-07-12 from the write-bar medal; the write-bar float/collapse rules (below the
 * base styles in `RoundButton.module.scss`) stay here — they anchor to
 * non-hashed `[data-write-bar]`/`[data-expanded]` ancestors and only fire inside a
 * bar, so keeping them beside the `.roundButton` class is safe (moving them to
 * WriteBarShell would hit the cross-module hash trap documented there). Renamed
 * from the old write-bar medal component; button-mode added in the same move.
 */
export const RoundButton = ({
  htmlFor,
  ariaLabel,
  onClick,
  img,
  imgWidth,
  imgNudgeX,
  imgNudgeY,
  centerNode,
  arcTop,
  arcBottom,
  sideChevron,
  dimmed,
  lifted,
  floating = true,
  look = 'flat',
  plateless,
  shadow,
  outlined,
}: RoundButtonProps) => {
  const { pressed, pressProps } = usePressFeedback();
  // Unique ids for the SVG arc paths (textPath references them by #id).
  const arcBase = useId().replace(/:/g, '');
  const arcTopId = `${arcBase}-t`;
  const arcBotId = `${arcBase}-b`;

  const imgStyle: CSSProperties | undefined =
    img && (imgWidth || imgNudgeX || imgNudgeY)
      ? {
          ...(imgWidth ? { width: imgWidth } : null),
          ...(imgNudgeX ? { ['--rb-img-nudge-x']: imgNudgeX } : null),
          ...(imgNudgeY ? { ['--rb-img-nudge-y']: imgNudgeY } : null),
        }
      : undefined;

  const inner = (
    <>
      {img ? (
        <img src={img} className={s.roundButtonImg} style={imgStyle} alt="" aria-hidden />
      ) : centerNode ? (
        <span className={s.roundButtonCenter} aria-hidden>
          {centerNode}
        </span>
      ) : null}
      {(arcTop || arcBottom) && (
        <svg className={s.roundButtonArc} viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <path id={arcTopId} d="M 14,50 A 36,36 0 0 1 86,50" fill="none" />
            <path id={arcBotId} d="M 3,50 A 47,47 0 0 0 97,50" fill="none" />
          </defs>
          {arcTop && (
            <text>
              <textPath href={`#${arcTopId}`} startOffset="50%" textAnchor="middle">
                {arcTop}
              </textPath>
            </text>
          )}
          {arcBottom && (
            <text>
              <textPath href={`#${arcBotId}`} startOffset="50%" textAnchor="middle">
                {arcBottom}
              </textPath>
            </text>
          )}
        </svg>
      )}
      {sideChevron && (
        <span className={s.roundButtonChevron} aria-hidden>
          <ChevronGlyph />
        </span>
      )}
    </>
  );

  const shared = {
    className: clsx(
      s.roundButton,
      lifted && s.lifted,
      plateless && s.plateless,
      shadow && s.shadow,
      outlined && s.outlined
    ),
    'aria-label': ariaLabel,
    onClick,
    'data-pressed': pressed || undefined,
    'data-dim': dimmed || undefined,
    'data-inline': !floating || undefined,
    'data-look': look,
    ...pressProps,
  };

  // No htmlFor → standalone button (no hidden input to delegate focus to).
  if (!htmlFor) {
    return (
      <button type="button" {...shared}>
        {inner}
      </button>
    );
  }

  return (
    <label htmlFor={htmlFor} {...shared}>
      {inner}
    </label>
  );
};

export default RoundButton;
