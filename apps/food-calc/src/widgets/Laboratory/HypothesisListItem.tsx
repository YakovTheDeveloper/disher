import { memo } from 'react';
import type { Hypothesis } from '@/entities/hypothesis';
import styles from './HypothesisListItem.module.scss';

type EditProps =
  | {
      /**
       * Open the edit modal for this row. Когда задано — клик по тексту строки
       * фокусит общий edit-input (через `editInputHtmlFor`), а onEdit одновременно
       * записывает в parent editingId. Оба ОБЯЗАТЕЛЬНЫ вместе — discriminated
       * union ловит «забыл htmlFor» на этапе типа.
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
} & EditProps;

// One hypothesis row. Two independent interactive zones, never nested:
//   - the checkbox toggles whether the hypothesis rides into the analysis;
//   - the text label фокусит общий edit-input EditHypothesisModal (label-driven
//     focus delegation — onClick только обновляет editingId в parent, step
//     перевернёт onFocusCapture после доставки фокуса).
// Surface is a stripe-fork row (gradient + accent stripe + fading hairline);
// nth-child rhythm + the palette come from the parent `[data-dv]` anchor.
const HypothesisListItem = ({
  hypothesis,
  selected,
  onToggle,
  onEdit,
  editInputHtmlFor,
  checkboxDisabled = false,
  hideCheckbox = false,
}: Props) => (
  <div
    className={styles.row}
    data-selected={selected || undefined}
    data-no-checkbox={hideCheckbox || undefined}
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
    {onEdit && editInputHtmlFor ? (
      <label
        htmlFor={editInputHtmlFor}
        className={styles.textButton}
        onClick={onEdit}
      >
        <span className={styles.title}>{hypothesis.title}</span>
        {hypothesis.body && (
          <span className={styles.body}>{hypothesis.body}</span>
        )}
      </label>
    ) : (
      <div className={styles.textButton}>
        <span className={styles.title}>{hypothesis.title}</span>
        {hypothesis.body && (
          <span className={styles.body}>{hypothesis.body}</span>
        )}
      </div>
    )}
  </div>
);

export default memo(HypothesisListItem);
