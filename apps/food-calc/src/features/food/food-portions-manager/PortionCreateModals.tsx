import { useEffect, useRef, useState } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import {
  usePortionFlow,
  type PortionDraft,
  PORTION_STEPS,
  PORTION_STEP_LABELS,
} from './usePortionFlow';
import s from './PortionCreateModals.module.scss';

type Props = {
  /** Существующие названия порций — для блокировки дубля в шаге 1. */
  existingLabels: string[];
  /** Единица измерения порции — суффикс рядом с числом ('г' / servingUnit). */
  unit: string;
  onCreate: (portion: PortionDraft) => Promise<void> | void;
};

/**
 * 2-шаговая модалка создания порции (название → количество). Канон HomePage/
 * dish-product: `ModalByLabel` × 2 + `ModalShell`. Spring-вариант — дефолт
 * (spring2), т.к. рендерится только на Product/Dish (см. memory о конвенции).
 * Сама владеет `onFocusCapture` И флоу-стейтом (usePortionFlow здесь, а не на
 * странице) — стейт не ре-рендерит страницу, а useSwipeableLock живёт внутри
 * Swipeable-контекста, как у канонных create-модалок. Триггер — AddPortionButton
 * (label htmlFor) в нижнем баре.
 */
const PortionCreateModals = ({ existingLabels, unit, onCreate }: Props) => {
  const {
    step,
    setStep,
    draft,
    updateGrams,
    isDuplicate,
    visitedSteps,
    handleFocusCapture,
    handleClose,
    handleConfirmName,
    handleCommit,
    inputIds: { NAME_INPUT, GRAMS_INPUT },
  } = usePortionFlow({ existingLabels, unit, onCreate });

  // Local state инпута названия — пересинк из draft.label при входе в шаг 'name'.
  const [name, setName] = useState('');
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== 'name' && step === 'name') setName(draft.label ?? '');
    prevStepRef.current = step;
  }, [step, draft.label]);

  const nameTrimmed = name.trim();
  const duplicate = isDuplicate(name);

  const goToStep = (target: typeof step) => setStep(target);

  // «Назад» по линейному порядку шагов; первый шаг (name) закрывает флоу.
  const handleBack = () => {
    const idx = PORTION_STEPS.indexOf(step as (typeof PORTION_STEPS)[number]);
    if (idx <= 0) {
      handleClose();
      return;
    }
    setStep(PORTION_STEPS[idx - 1]);
  };

  const stepResults = {
    name: draft.label || undefined,
    grams: draft.grams || undefined,
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Шаг 1: Название */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'name'}
        content={
          <ModalShell>
            <ModalShell.Header title="Новая порция" onBack={handleClose} />
            <ModalShell.Body>
              <AutoGrowSearch
                singleLine
                id={NAME_INPUT}
                value={name}
                onChange={setName}
                placeholder="Название порции"
                autoComplete="off"
              />
              {duplicate && nameTrimmed ? (
                <ModalShell.Hint>Порция с таким названием уже есть</ModalShell.Hint>
              ) : null}
              <ModalShell.ActionButtons
                debugId="portion-name"
                right={
                  nameTrimmed && !duplicate ? (
                    <ModalNextButton
                      as="label"
                      htmlFor={GRAMS_INPUT}
                      onClick={() => handleConfirmName(name)}
                      label="Далее"
                    />
                  ) : (
                    <ModalNextButton onClick={() => {}} label="Далее" disabled />
                  )
                }
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Шаг 2: Количество */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'grams'}
        content={
          <ModalShell>
            <ModalShell.StepHeader
              title={PORTION_STEP_LABELS.grams}
              currentStep="grams"
              steps={PORTION_STEPS}
              stepLabels={PORTION_STEP_LABELS}
              stepResults={stepResults}
              visitedSteps={visitedSteps}
              onBack={handleBack}
              onStepClick={goToStep}
            />

            <ModalShell.Body>
              <div className={s.gramsRow}>
                <NumberInput
                  id={GRAMS_INPUT}
                  value={draft.grams}
                  min={0}
                  maxLength={5}
                  size="big"
                  onChange={updateGrams}
                />
                <span className={s.gramsUnit}>{unit}</span>
              </div>
              <ModalShell.ActionButtons
                debugId="portion-grams"
                right={
                  <ModalNextButton
                    onClick={handleCommit}
                    variant="finish"
                    disabled={draft.grams <= 0}
                  />
                }
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default PortionCreateModals;
