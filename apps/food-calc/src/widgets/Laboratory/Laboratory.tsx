import { memo, useCallback, useMemo, useState, type FocusEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { useAllHypotheses } from '@/entities/hypothesis';
import { AnalysisCtaButton } from '@/features/analysis/AnalysisCtaButton';
import {
  CreateHypothesisModal,
  CREATE_HYPOTHESIS_TITLE_INPUT_ID,
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import { RouterLinks } from '@/app/router';
import { PlusIcon } from '@/shared/ui/atoms/Button/AddButton/AddButton';
import HypothesisListPanel from './HypothesisListPanel';
import DailyAnalysisSection from './DailyAnalysisSection';
import styles from './Laboratory.module.scss';

type Props = {
  date: string;
  topSlot?: React.ReactNode;
};

// HomePage slot 0 — the Laboratory. Hypothesis list (tick → ride into the
// analysis, tap → edit) + the inline daily-analysis surface. The bottom bar
// carries two CTAs: «Разбор» (opens the kind chooser) and «Добавить
// гипотезу» (label → focuses the title input inside CreateHypothesisModal).
// Tap on a hypothesis row is also a label htmlFor — opens EditHypothesisModal.
const Laboratory = ({ date, topSlot }: Props) => {
  const navigate = useNavigate();
  const hypotheses = useAllHypotheses();

  // Which hypotheses ride into the next analysis. Ephemeral UI state — lives
  // here so AnalysisCtaButton (and, through it, AnalysisKindDrawer) can read
  // the snapshot at start time.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Create/Edit modal steps. Triggered by <label htmlFor> focus delegation:
  // клик на label фокусит общий (collapsed) input, focus bubbles up React tree
  // → handleFocusCapture флипает соответствующий step. editingId меняется
  // синхронно onClick'ом на label строки (он — draft data, не step, поэтому
  // setEditingId в onClick безопасен и не размонтирует label).
  const [createStep, setCreateStep] = useState<'idle' | 'create'>('idle');
  const [editStep, setEditStep] = useState<'idle' | 'edit'>('idle');
  const [editingHypothesisId, setEditingHypothesisId] = useState<string | null>(null);

  // Prune selection against the live list — a deleted hypothesis must not
  // keep inflating the «N выбрано» count or the started snapshot.
  const validSelected = useMemo(() => {
    const live = new Set(hypotheses.map((h) => h.id));
    return new Set([...selectedIds].filter((id) => live.has(id)));
  }, [selectedIds, hypotheses]);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleFocusCapture = useCallback((e: FocusEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).id;
    if (id === CREATE_HYPOTHESIS_TITLE_INPUT_ID) setCreateStep('create');
    else if (id === EDIT_HYPOTHESIS_TITLE_INPUT_ID) setEditStep('edit');
  }, []);

  const closeCreate = useCallback(() => setCreateStep('idle'), []);
  const closeEdit = useCallback(() => {
    setEditStep('idle');
    setEditingHypothesisId(null);
  }, []);

  const bottomBar = (
    <AppBottomBarShell side="split">
      <AnalysisCtaButton date={date} selectedIds={[...validSelected]} />
      <label
        htmlFor={CREATE_HYPOTHESIS_TITLE_INPUT_ID}
        className={styles.newHypothesisButton}
      >
        <span className={styles.plusIcon} aria-hidden="true">
          <PlusIcon />
        </span>
        Добавить гипотезу
      </label>
    </AppBottomBarShell>
  );

  return (
    <div className={styles.focusPassthrough} onFocusCapture={handleFocusCapture}>
      <Screen stickyTop={topSlot} headerOverlap bottomBar={bottomBar}>
        <div className={styles.container}>
          <div className={styles.topLinkRow}>
            <button
              type="button"
              className={styles.weeklyLink}
              onClick={() => navigate(RouterLinks.Analyses)}
            >
              Анализ по неделям →
            </button>
          </div>

          <HypothesisListPanel
            hypotheses={hypotheses}
            selectedIds={validSelected}
            onToggle={handleToggle}
            onEditHypothesis={setEditingHypothesisId}
            editInputHtmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
          />

          <DailyAnalysisSection date={date} />
        </div>
      </Screen>
      <CreateHypothesisModal
        isExpanded={createStep === 'create'}
        onClose={closeCreate}
      />
      <EditHypothesisModal
        hypothesisId={editingHypothesisId}
        isExpanded={editStep === 'edit'}
        onClose={closeEdit}
      />
    </div>
  );
};

export default memo(Laboratory);
