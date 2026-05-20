import { memo } from 'react';
import type { Hypothesis } from '@/entities/hypothesis';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import HypothesisListItem from './HypothesisListItem';
import styles from './HypothesisListPanel.module.scss';

// Palette forks for the hypothesis rows — flip live via the DesignVariantsBar.
// First entry is the default (lavender — calm, faintly "lab").
const PALETTE_VARIANTS = ['lavender', 'warm', 'sand', 'mint'] as const;

// Hard cap on how many hypotheses ride into one analysis: keeps the LLM
// prompt bounded — extra checkboxes are disabled with a hint.
const MAX_SELECTED = 10;

type EditProps =
  | {
      /** Записать parent editingId. focus → step перевернёт onFocusCapture. */
      onEditHypothesis: (id: string) => void;
      /** Общий input id единственного EditHypothesisModal в parent. */
      editInputHtmlFor: string;
    }
  | { onEditHypothesis?: undefined; editInputHtmlFor?: undefined };

type Props = {
  hypotheses: Hypothesis[];
  /** Ids ticked for the next analysis. */
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  /**
   * Caps the scrollable body. A long list scrolls inside this box while the
   * surrounding Screen still scrolls down to the daily-analysis section.
   * Defaults to `58vh`; a drawer host can pass a smaller value.
   */
  maxBodyHeight?: string;
  /**
   * `false` hides the selection checkboxes entirely — a pure CRUD list with
   * no «ride into the analysis» concept (AnalysesPage hypotheses slide).
   * Defaults to `true`.
   */
  selectable?: boolean;
} & EditProps;

// The hypothesis list: a static header label + a height-bounded, internally
// scrollable body of stripe-fork rows. No collapse — the body cap keeps the
// list from pushing the daily analysis off-screen on HomePage.
const HypothesisListPanel = ({
  hypotheses,
  selectedIds,
  onToggle,
  onEditHypothesis,
  editInputHtmlFor,
  maxBodyHeight = '58vh',
  selectable = true,
}: Props) => {
  const { anchor } = useDesignVariant('LabHypothesis', PALETTE_VARIANTS);

  const total = hypotheses.length;
  const selectedCount = selectedIds.size;
  const capReached = selectable && selectedCount >= MAX_SELECTED;

  if (total === 0) {
    return (
      <section className={styles.empty}>
        <p className={styles.emptyTitle}>Гипотез пока нет</p>
        <p className={styles.emptyBody}>
          Гипотеза — это короткая догадка о себе, которую хочется проверить.
          Добавь первую кнопкой «+ Гипотеза» внизу.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Мои гипотезы</span>
        <span className={styles.headerCount}>
          {selectable ? `${selectedCount} выбрано из ${total}` : total}
        </span>
      </div>

      <div className={styles.scrollWrap}>
        <div
          className={styles.scrollBody}
          style={{ maxHeight: maxBodyHeight }}
          {...anchor}
        >
          {hypotheses.map((h) => {
            const selected = selectedIds.has(h.id);
            const editProps =
              onEditHypothesis && editInputHtmlFor
                ? {
                    onEdit: () => onEditHypothesis(h.id),
                    editInputHtmlFor,
                  }
                : {};
            return (
              <HypothesisListItem
                key={h.id}
                hypothesis={h}
                selected={selected}
                onToggle={() => onToggle(h.id)}
                checkboxDisabled={capReached && !selected}
                hideCheckbox={!selectable}
                {...editProps}
              />
            );
          })}
        </div>
      </div>

      {capReached && (
        <p className={styles.capHint}>
          В один разбор берётся максимум {MAX_SELECTED} гипотез.
        </p>
      )}
    </section>
  );
};

export default memo(HypothesisListPanel);
