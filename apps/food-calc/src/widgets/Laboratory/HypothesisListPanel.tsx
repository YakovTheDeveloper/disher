import { memo, useEffect, useRef } from 'react';
import type { Hypothesis } from '@/entities/hypothesis';
import { Heading } from '@/shared/ui/atoms/Typography';
import { FieldLabel } from '@/shared/ui/atoms/Typography/FieldLabel';
import HypothesisListItem from './HypothesisListItem';
import styles from './HypothesisListPanel.module.scss';

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
   * Defaults to `58vh`; a drawer host can pass a smaller value. Pass `'none'`
   * to let the list flow at its natural height (no inner scroll) — for a modal
   * that owns the single scroll container itself.
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
   * Owned by the host (HypothesesSlide); cleared on remount (reload / leaving).
   */
  newIds?: Set<string>;
  /**
   * `title` (default) — рисует заголовок «Гипотезы» + счётчик над списком.
   * `divider` — заголовок/счётчик не рисуются (их несёт хост, напр. шапка
   * модалки), вместо них — тонкий fading-hairline divider.
   */
  headerVariant?: 'title' | 'divider';
  /**
   * Голос заголовка «Гипотезы» в варианте `title`. `'heading'` (default) —
   * Alice-serif heading (HomePage / HypothesesSlide). `'label'` — тот же
   * serif-italic FieldLabel, что и подписи полей (модалка создания разбора),
   * чтобы заголовок секции звучал в один голос с лейблами.
   */
  titleVariant?: 'heading' | 'label';
  /**
   * Show the read-only meta line (relative date) on each row. Only the
   * view-first hypotheses screen passes `true`; selection hosts leave it off so
   * their rows stay clean (checkbox + title only).
   */
  showMeta?: boolean;
  /**
   * Row surface presentation, forwarded to each `HypothesisListItem`.
   * `'flush'` (default) — compact hairline-divided rows in a single shadowed
   * frame (selection hosts). `'analysis'` — the «Анализ дня» look: frame off,
   * rows flow flush with fading-hairline dividers (the «Открытия» slide).
   */
  presentation?: 'flush' | 'analysis';
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
  headerVariant = 'title',
  titleVariant = 'heading',
  showMeta = false,
  presentation = 'flush',
}: Props) => {
  // The list scrolls inside itself (`maxBodyHeight`). A freshly created
  // hypothesis lands at the top of this inner scroll, so when a new id arrives
  // we reset scrollTop — otherwise, on a long list scrolled down, the new row
  // and its «new» ring would be created above the fold and never seen.
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (newIds && newIds.size > 0 && scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
  }, [newIds]);

  const total = hypotheses.length;
  const selectedCount = selectedIds.size;
  const capReached = selectable && selectedCount >= MAX_SELECTED;
  // `'none'` — список течёт по натуральной высоте, без внутреннего скролла
  // (модалка владеет единственным скроллом тела).
  const bounded = maxBodyHeight !== 'none';
  const analysis = presentation === 'analysis';

  // Пустой список — никакой подсказки: композер выше с живым плейсхолдером
  // («Головная боль после молочки») сам учит формату записи (решение 2026-06-08).
  if (total === 0) return null;

  return (
    <section className={styles.section}>
      {headerVariant === 'divider' ? (
        <div className={styles.divider} aria-hidden />
      ) : (
        <div className={styles.header}>
          {titleVariant === 'label' ? (
            <FieldLabel>Гипотезы</FieldLabel>
          ) : (
            <Heading role="title" className={styles.headerTitle}>
              Гипотезы
            </Heading>
          )}
          <span className={styles.headerCount}>
            {selectable ? `${selectedCount} выбрано из ${total}` : total}
          </span>
        </div>
      )}

      <div className={`${styles.scrollWrap} ${analysis ? styles.scrollWrapAnalysis : ''}`}>
        <div
          data-testid="hypothesis-scroll-body"
          className={`${styles.scrollBody} ${bounded ? '' : styles.scrollBodyFlow} ${
            analysis ? styles.scrollBodyAnalysis : ''
          }`}
          style={bounded ? { maxHeight: maxBodyHeight } : undefined}
          ref={scrollBodyRef}
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
                showMeta={showMeta}
                presentation={presentation}
                {...editProps}
              />
            );
          })}
        </div>
      </div>

      {capReached && (
        <p className={styles.capHint}>В один разбор берётся максимум {MAX_SELECTED} гипотез.</p>
      )}
    </section>
  );
};

export default memo(HypothesisListPanel);
