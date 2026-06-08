import { memo, useCallback, useEffect, useState, type FocusEvent } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { useAllHypotheses } from '@/entities/hypothesis';
import {
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import HypothesisSection from './HypothesisSection';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// Fullscreen «Гипотезы» — the CRUD management surface lifted off HomePage
// screen 0. Composer + list (NO selection checkboxes) + the nested
// EditHypothesisModal, wired exactly like the old inline Laboratory: a
// <label htmlFor> on each row focuses the single edit input, focus bubbles to
// onFocusCapture (across the portal, via the React tree), the edit step flips.
// Two sibling ModalByLabel surfaces (manage / edit) — the same idiom as
// ScheduleFoodCreateModals. Selection for a run lives elsewhere
// (AnalysisClarificationModal); here it is pure create/edit/delete.
const HypothesisManagerModal = ({ isOpen, onClose }: Props) => {
  const hypotheses = useAllHypotheses();
  const [editing, setEditing] = useState(false);
  const [editingHypothesisId, setEditingHypothesisId] = useState<string | null>(
    null,
  );

  // Closing the manager resets the edit sub-step so a re-open lands on the list.
  useEffect(() => {
    if (!isOpen) {
      setEditing(false);
      setEditingHypothesisId(null);
    }
  }, [isOpen]);

  // Focus delegation: the row label focuses EDIT_HYPOTHESIS_TITLE_INPUT_ID;
  // its onClick has already set editingHypothesisId (draft data, not step), so
  // flipping the step here — after focus lands — keeps the label mounted.
  const handleFocusCapture = useCallback((e: FocusEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).id;
    if (id === EDIT_HYPOTHESIS_TITLE_INPUT_ID) setEditing(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditing(false);
    setEditingHypothesisId(null);
  }, []);

  return (
    <div onFocusCapture={handleFocusCapture}>
      <ModalByLabel
        position="absolute"
        isExpanded={isOpen && !editing}
        content={
          <ModalShell variant="spring4">
            <ModalShell.Header title="Гипотезы" onBack={onClose} />
            <ModalShell.Body>
              <HypothesisSection
                hypotheses={hypotheses}
                selectable={false}
                onEditHypothesis={setEditingHypothesisId}
                editInputHtmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />
      <EditHypothesisModal
        hypothesisId={editingHypothesisId}
        isExpanded={isOpen && editing}
        onClose={closeEdit}
      />
    </div>
  );
};

export default memo(HypothesisManagerModal);
