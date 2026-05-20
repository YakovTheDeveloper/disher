import { memo, useCallback, useMemo, useState, type FocusEvent, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { useAllHypotheses } from '@/entities/hypothesis';
import {
  CreateHypothesisModal,
  CREATE_HYPOTHESIS_TITLE_INPUT_ID,
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import styles from './HypothesesSlide.module.scss';

type Props = {
  topBar: ReactNode;
};

const noop = () => {};

// AnalysesPage slide 0 — a pure hypothesis CRUD list. No selection here
// (`selectable={false}` hides the checkboxes); a tap opens EditHypothesisModal.
const HypothesesSlide = ({ topBar }: Props) => {
  const hypotheses = useAllHypotheses();
  // Stable empty selection — this slide never selects.
  const emptySelection = useMemo(() => new Set<string>(), []);

  // Create/Edit modal steps. label htmlFor → focus → onFocusCapture flips
  // соответствующий step. editingId — отдельная draft-data (см. Laboratory).
  const [createStep, setCreateStep] = useState<'idle' | 'create'>('idle');
  const [editStep, setEditStep] = useState<'idle' | 'edit'>('idle');
  const [editingHypothesisId, setEditingHypothesisId] = useState<string | null>(null);

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
    <AppBottomBarShell side="left">
      <label htmlFor={CREATE_HYPOTHESIS_TITLE_INPUT_ID} className={styles.cta}>
        + Гипотеза
      </label>
    </AppBottomBarShell>
  );

  return (
    <div onFocusCapture={handleFocusCapture}>
      <Screen stickyTop={topBar} headerOverlap bottomBar={bottomBar}>
        <div className={styles.container}>
          <HypothesisListPanel
            hypotheses={hypotheses}
            selectedIds={emptySelection}
            onToggle={noop}
            onEditHypothesis={setEditingHypothesisId}
            editInputHtmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
            selectable={false}
            maxBodyHeight="74vh"
          />
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

export default memo(HypothesesSlide);
