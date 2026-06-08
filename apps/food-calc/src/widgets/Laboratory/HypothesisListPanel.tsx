import { memo, useCallback, useEffect, useRef } from 'react';
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
  /**
   * Ids just created in this view — each paints the ephemeral «new» ring.
   * Owned by HypothesisSection; cleared on remount (reload / leaving screen).
   */
  newIds?: Set<string>;
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
  newIds,
}: Props) => {
  const { anchor } = useDesignVariant('LabHypothesis', PALETTE_VARIANTS);

  // The list scrolls inside itself (`maxBodyHeight`). A freshly created
  // hypothesis lands at the top of this inner scroll, so when a new id arrives
  // we reset scrollTop — otherwise, on a long list scrolled down, the new row
  // and its «new» ring would be created above the fold and never seen.
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const anchorRefFn = anchor.ref;
  const setScrollBodyRef = useCallback(
    (el: HTMLDivElement | null) => {
      scrollBodyRef.current = el;
      anchorRefFn(el); // keep the design-variant IntersectionObserver wired
    },
    [anchorRefFn],
  );
  useEffect(() => {
    if (newIds && newIds.size > 0 && scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
  }, [newIds]);

  const total = hypotheses.length;
  const selectedCount = selectedIds.size;
  const capReached = selectable && selectedCount >= MAX_SELECTED;

  // Пустой список — никакой подсказки: композер выше с живым плейсхолдером
  // («Головная боль после молочки») сам учит формату записи (решение 2026-06-08).
  if (total === 0) return null;

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
          data-dv={anchor['data-dv']}
          data-dv-v={anchor['data-dv-v']}
          ref={setScrollBodyRef}
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
                isNew={newIds?.has(h.id) ?? false}
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
