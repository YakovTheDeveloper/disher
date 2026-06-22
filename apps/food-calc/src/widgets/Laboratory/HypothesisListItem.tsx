import { memo } from 'react';
import type { Hypothesis } from '@/entities/hypothesis';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { relativeTimeRu } from '@/shared/lib/time/relativeTimeRu';
import styles from './HypothesisListItem.module.scss';

type EditProps =
  | {
      /**
       * Open the edit modal for this row. Когда задано — рендерится шеврон
       * справа-снизу; клик по нему фокусит общий edit-input (через
       * `editInputHtmlFor`), а onEdit одновременно записывает в parent editingId.
       * Оба ОБЯЗАТЕЛЬНЫ вместе — discriminated union ловит «забыл htmlFor» на
       * этапе типа.
       */
      onEdit: () => void;
      /** id единого edit-input'а, который рендерит EditHypothesisModal. */
      editInputHtmlFor: string;
    }
  | { onEdit?: undefined; editInputHtmlFor?: undefined };

type Props = {
  hypothesis: Hypothesis;
  selected: boolean;
  onToggle: () => void;
  /** Disabled checkbox — e.g. the selection cap was reached, or read-only. */
  checkboxDisabled?: boolean;
  /** Hide the selection checkbox entirely (pure CRUD list, no selection). */
  hideCheckbox?: boolean;
  /** Just created in this view — paints the ephemeral «new» ring. */
  isNew?: boolean;
  /**
   * Render the read-only meta line (relative «created» date). Only the
   * view-first hypotheses screen passes this; selection lists keep rows clean.
   */
  showMeta?: boolean;
  /**
   * Surface presentation. `'flush'` (default) — compact rows on the app tone
   * (`--card-*`), accent stripe + per-row hairline; used by the selection lists.
   * `'analysis'` — the «Анализ дня» look (`--ax-*`): surface off, no accent
   * stripe, fading-hairline divider, Apple type scale; the «Открытия» slide.
   */
  presentation?: 'flush' | 'analysis';
} & EditProps;

// One hypothesis row. The text is inert; interaction lives in two zones that
// never nest:
//   - the checkbox toggles whether the hypothesis rides into the analysis;
//   - the trailing chevron (bottom-right) фокусит общий edit-input
//     EditHypothesisModal (label-driven focus delegation — onClick только
//     обновляет editingId в parent, step перевернёт onFocusCapture после
//     доставки фокуса). Рендерится только при onEdit + editInputHtmlFor.
// Surface is token-driven: `'flush'` uses the app tone (`--card-*`),
// `'analysis'` the «Анализ дня» hairline look (`--ax-*`).
const HypothesisListItem = ({
  hypothesis,
  selected,
  onToggle,
  onEdit,
  editInputHtmlFor,
  checkboxDisabled = false,
  hideCheckbox = false,
  isNew = false,
  showMeta = false,
  presentation = 'flush',
}: Props) => {
  const meta = showMeta ? relativeTimeRu(hypothesis.createdAt) : '';
  const content = (
    <>
      <span className={styles.title}>{hypothesis.title}</span>
      {hypothesis.body && <span className={styles.body}>{hypothesis.body}</span>}
      {meta && <span className={styles.meta}>{meta}</span>}
    </>
  );

  return (
    <div
      className={styles.row}
      data-selected={selected || undefined}
      data-no-checkbox={hideCheckbox || undefined}
      data-new={isNew || undefined}
      data-presentation={presentation === 'analysis' ? 'analysis' : undefined}
    >
      {!hideCheckbox && (
        <label className={styles.checkboxWrap}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={selected}
            disabled={checkboxDisabled}
            onChange={onToggle}
            aria-label={`Включить в разбор: ${hypothesis.title}`}
          />
          <span className={styles.checkboxBox} aria-hidden="true" />
        </label>
      )}
      {/* Текст инертный — триггер редактирования вынесен на шеврон справа-снизу. */}
      <div className={styles.textButton}>{content}</div>
      {onEdit && editInputHtmlFor && (
        <label
          htmlFor={editInputHtmlFor}
          className={styles.editChevron}
          onClick={onEdit}
          aria-label="Редактировать гипотезу"
        >
          <ChevronGlyph />
        </label>
      )}
    </div>
  );
};

export default memo(HypothesisListItem);
