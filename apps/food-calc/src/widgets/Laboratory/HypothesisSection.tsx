import { memo, useCallback, useState } from 'react';
import type { Hypothesis } from '@/entities/hypothesis';
import HypothesisComposer from './HypothesisComposer';
import HypothesisListPanel from './HypothesisListPanel';
import styles from './HypothesisSection.module.scss';

// Stable fallbacks for the read-only (selectable=false) hosts — the panel
// requires both props, but a pure CRUD list never selects.
const EMPTY_SELECTION: Set<string> = new Set();
const noop = () => {};

type EditProps =
  | {
      onEditHypothesis: (id: string) => void;
      editInputHtmlFor: string;
    }
  | { onEditHypothesis?: undefined; editInputHtmlFor?: undefined };

type Props = {
  hypotheses: Hypothesis[];
  /** Selection (HomePage). Omit + selectable=false ⇒ pure CRUD list. */
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  /** `false` hides the checkboxes (AnalysesPage hypotheses slide). */
  selectable?: boolean;
  /** Caps the scrollable list body; a drawer/page host can shrink it. */
  maxBodyHeight?: string;
  /** Id поля композера — для ModalByLabel-открытия модалки внешним label'ом. */
  composerInputId?: string;
  /** Вид кнопки «Добавить» композера: `inline` (страница) / `floating` (модалка). */
  composerSubmitVariant?: 'inline' | 'floating';
  /** `field`-Heading над полем композера (напр. «Добавление новой»). */
  composerHeading?: string;
  /** Вид шапки списка: `title` (заголовок+счётчик) / `divider` (см. панель). */
  listHeaderVariant?: 'title' | 'divider';
} & EditProps;

// The shared hypotheses widget (Variant B): inline composer on top, list below.
// It owns the ephemeral «new» marker — `newIds` lives here so neither host has
// to thread it, and it clears on remount (reload / leaving the screen).
const HypothesisSection = ({
  hypotheses,
  selectedIds,
  onToggle,
  selectable = true,
  maxBodyHeight,
  composerInputId,
  composerSubmitVariant,
  composerHeading,
  listHeaderVariant,
  onEditHypothesis,
  editInputHtmlFor,
}: Props) => {
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());

  const markNew = useCallback((id: string) => {
    setNewIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Forward edit-delegation only as a correlated pair (or not at all) so the
  // panel's discriminated EditProps union stays satisfied.
  const editProps =
    onEditHypothesis && editInputHtmlFor
      ? { onEditHypothesis, editInputHtmlFor }
      : {};

  return (
    <div className={styles.section}>
      <HypothesisComposer
        onCreated={markNew}
        inputId={composerInputId}
        submitVariant={composerSubmitVariant}
        heading={composerHeading}
      />
      <HypothesisListPanel
        hypotheses={hypotheses}
        selectedIds={selectedIds ?? EMPTY_SELECTION}
        onToggle={onToggle ?? noop}
        selectable={selectable}
        maxBodyHeight={maxBodyHeight}
        newIds={newIds}
        headerVariant={listHeaderVariant}
        {...editProps}
      />
    </div>
  );
};

export default memo(HypothesisSection);
