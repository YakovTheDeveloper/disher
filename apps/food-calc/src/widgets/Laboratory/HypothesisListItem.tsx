import { memo } from 'react';
import type { Hypothesis } from '@/entities/hypothesis';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { SelectionTick } from '@/shared/ui/atoms/SelectionTick';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
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
   * (`--sys-card-*`), accent stripe + per-row hairline; used by the selection lists.
   * `'analysis'` — the «Анализ дня» look (`--ax-*`): surface off, no accent
   * stripe, fading-hairline divider, Apple type scale; the «Открытия» slide.
   * `'well'` — ряд внутри вдавленного поля (модалка создания разбора): фон
   * прозрачный (его несёт well), полоска-акцент и hairline остаются.
   */
  presentation?: 'flush' | 'analysis' | 'well';
} & EditProps;

// One hypothesis row. The text is inert; interaction lives in two zones that
// never nest:
//   - the checkbox toggles whether the hypothesis rides into the analysis;
//   - the trailing chevron (bottom-right) фокусит общий edit-input
//     EditHypothesisModal (label-driven focus delegation — onClick только
//     обновляет editingId в parent, step перевернёт onFocusCapture после
//     доставки фокуса). Рендерится только при onEdit + editInputHtmlFor.
// Surface is token-driven: `'flush'` uses the app tone (`--sys-card-*`),
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
  // Тело кликабельно как тоггл только когда есть чекбокс и он не заблокирован
  // (лимит выбора). Иначе — инертный текст (CRUD-список / cap reached).
  const bodyToggles = !hideCheckbox && !checkboxDisabled;
  const content = (
    <>
      <Heading as="span" role="title" className={styles.title}>
        {hypothesis.title}
      </Heading>
      {hypothesis.body && (
        <Text as="span" role="body" className={styles.body}>
          {hypothesis.body}
        </Text>
      )}
      {meta && (
        <Text as="span" role="caption" className={styles.meta}>
          {meta}
        </Text>
      )}
    </>
  );

  return (
    <div
      className={styles.row}
      data-selected={selected || undefined}
      data-no-checkbox={hideCheckbox || undefined}
      data-new={isNew || undefined}
      data-presentation={presentation === 'flush' ? undefined : presentation}
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
          <span className={styles.checkboxBox} aria-hidden="true">
            <SelectionTick className={styles.checkboxTick} />
          </span>
        </label>
      )}
      {/* Клик по телу гипотезы = тот же тоггл, что чекбокс (юзер-канон 2026-07-03):
          применить/снять гипотезу можно по всей карточке, не целясь в чекбокс.
          Активно только в selection-режиме (есть чекбокс) и когда он не заблокирован
          лимитом. В чистом CRUD-списке (`hideCheckbox`) тело остаётся инертным —
          там выбора нет. Редактирование живёт на шевроне справа-снизу (отд. зона). */}
      <div
        className={styles.textButton}
        data-toggle={bodyToggles || undefined}
        onClick={bodyToggles ? onToggle : undefined}
      >
        {content}
      </div>
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
