import { memo, useCallback, useState, type FocusEvent } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { useAllHypotheses } from '@/entities/hypothesis';
import {
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import HypothesisSection from './HypothesisSection';

// Композер фокусится по этому id. Кнопка «Гипотезы» в нижнем баре Laboratory
// рендерится как <label htmlFor={HYPOTHESIS_COMPOSER_INPUT_ID}>; фокус
// делегируется в поле композера (по React-дереву — через портал ModalByLabel),
// onFocusCapture ловит его и раскрывает менеджер. Тот же ModalByLabel-идиом,
// что у «Найти еду» / «Добавить событие».
export const HYPOTHESIS_COMPOSER_INPUT_ID = 'hypothesis-composer-title';

type Step = 'idle' | 'manage' | 'edit';

// Fullscreen «Гипотезы» — CRUD-поверхность с HomePage screen 0. Composer + list
// (без чекбоксов выбора) + вложенная EditHypothesisModal. Самоуправляемая через
// focus-делегацию: внешний <label htmlFor> раскрывает менеджер, <label> на
// строке списка уводит в edit. Две sibling-поверхности ModalByLabel
// (manage / edit) — тот же идиом, что ScheduleFoodCreateModals. Выбор гипотез
// для разбора живёт в другом месте (AnalysisClarificationModal); здесь — чистый
// create / edit / delete.
const HypothesisManagerModal = () => {
  const hypotheses = useAllHypotheses();
  const [step, setStep] = useState<Step>('idle');
  const [editingHypothesisId, setEditingHypothesisId] = useState<string | null>(
    null,
  );

  useSwipeableLock(step !== 'idle');

  // Focus delegation. Композер-id раскрывает менеджер (idle → manage);
  // edit-id (строка списка) уводит в редактирование. onClick строки уже
  // записал editingHypothesisId (draft-данные, не шаг), поэтому флип шага
  // здесь — ПОСЛЕ того как фокус приземлился — держит <label> смонтированным.
  const handleFocusCapture = useCallback((e: FocusEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).id;
    if (id === HYPOTHESIS_COMPOSER_INPUT_ID) {
      setStep((s) => (s === 'idle' ? 'manage' : s));
    } else if (id === EDIT_HYPOTHESIS_TITLE_INPUT_ID) {
      setStep('edit');
    }
  }, []);

  // Закрытие менеджера целиком (header back / hardware back) — на список.
  const handleClose = useCallback(() => {
    setStep('idle');
    setEditingHypothesisId(null);
  }, []);

  // Закрытие редактора возвращает к списку (manage), не закрывает менеджер.
  const closeEdit = useCallback(() => {
    setStep('manage');
    setEditingHypothesisId(null);
  }, []);

  useOverlayHistory(step !== 'idle', handleClose);

  return (
    <div onFocusCapture={handleFocusCapture}>
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'manage'}
        content={
          <ModalShell variant="spring4">
            <ModalShell.Header
              title="Гипотезы"
              subtitle={hypotheses.length > 0 ? String(hypotheses.length) : undefined}
              onBack={handleClose}
            />
            <ModalShell.Body>
              <HypothesisSection
                hypotheses={hypotheses}
                selectable={false}
                composerInputId={HYPOTHESIS_COMPOSER_INPUT_ID}
                composerSubmitVariant="floating"
                composerHeading="Добавление новой"
                listHeaderVariant="divider"
                onEditHypothesis={setEditingHypothesisId}
                editInputHtmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />
      <EditHypothesisModal
        hypothesisId={editingHypothesisId}
        isExpanded={step === 'edit'}
        onClose={closeEdit}
      />
    </div>
  );
};

export default memo(HypothesisManagerModal);
