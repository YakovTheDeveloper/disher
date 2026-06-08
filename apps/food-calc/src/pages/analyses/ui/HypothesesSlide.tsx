import { memo, useCallback, useState, type FocusEvent, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { useAllHypotheses } from '@/entities/hypothesis';
import {
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import HypothesisSection from '@/widgets/Laboratory/HypothesisSection';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import styles from './HypothesesSlide.module.scss';

type Props = {
  topBar: ReactNode;
};

// AnalysesPage slide 0 — a pure hypothesis CRUD list (`selectable={false}`
// hides the checkboxes). Creation is inline via the composer inside
// HypothesisSection; a tap on a row opens EditHypothesisModal. No bottom bar:
// the old empty-shell height-spacer was dropped 2026-06-08 (floating-bar canon
// made it a zero-height absolute element — it no longer reserved space anyway).
const HypothesesSlide = ({ topBar }: Props) => {
  const hypotheses = useAllHypotheses();

  // Edit modal step. label htmlFor → focus → onFocusCapture flips the step.
  const [editStep, setEditStep] = useState<'idle' | 'edit'>('idle');
  const [editingHypothesisId, setEditingHypothesisId] = useState<string | null>(null);

  const handleFocusCapture = useCallback((e: FocusEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).id;
    if (id === EDIT_HYPOTHESIS_TITLE_INPUT_ID) setEditStep('edit');
  }, []);

  const closeEdit = useCallback(() => {
    setEditStep('idle');
    setEditingHypothesisId(null);
  }, []);

  return (
    <div onFocusCapture={handleFocusCapture}>
      <Screen
        stickyTop={topBar}
        headerOverlap
        contentHeader={<Heading size="section">Гипотезы</Heading>}
      >
        <div className={styles.container}>
          <HypothesisSection
            hypotheses={hypotheses}
            onEditHypothesis={setEditingHypothesisId}
            editInputHtmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
            selectable={false}
            maxBodyHeight="74vh"
          />
        </div>
      </Screen>
      <EditHypothesisModal
        hypothesisId={editingHypothesisId}
        isExpanded={editStep === 'edit'}
        onClose={closeEdit}
      />
    </div>
  );
};

export default memo(HypothesesSlide);
