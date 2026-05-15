import { memo } from 'react';
import type { Hypothesis } from '@/entities/hypothesis';
import styles from './HypothesisListItem.module.scss';

type Props = {
  hypothesis: Hypothesis;
  selected: boolean;
  onToggle: () => void;
  /** Tap on the row body (not the checkbox) opens the edit drawer. */
  onEdit?: () => void;
  /** Disabled checkbox — e.g. the selection cap was reached, or read-only. */
  checkboxDisabled?: boolean;
  /** Hide the selection checkbox entirely (pure CRUD list, no selection). */
  hideCheckbox?: boolean;
};

// One hypothesis row. Two independent interactive zones, never nested:
//   - the checkbox toggles whether the hypothesis rides into the analysis;
//   - the text button opens the edit drawer.
// Surface is a stripe-fork row (gradient + accent stripe + fading hairline);
// nth-child rhythm + the palette come from the parent `[data-dv]` anchor.
const HypothesisListItem = ({
  hypothesis,
  selected,
  onToggle,
  onEdit,
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
    <button
      type="button"
      className={styles.textButton}
      onClick={onEdit}
      disabled={!onEdit}
    >
      <span className={styles.title}>{hypothesis.title}</span>
      {hypothesis.body && (
        <span className={styles.body}>{hypothesis.body}</span>
      )}
    </button>
  </div>
);

export default memo(HypothesisListItem);
