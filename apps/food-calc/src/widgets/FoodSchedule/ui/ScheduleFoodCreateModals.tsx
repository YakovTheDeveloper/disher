import { useEffect, useRef, useState } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { TextInput } from '@/shared/ui/atoms/input/TextInput';
import { DetailsChips, useHasDetailsHints } from '@/features/food/details-chips';
import {
  useScheduleFoodFlow,
  CREATE_STEPS_WITH_DETAILS,
  CREATE_STEPS_NO_DETAILS,
  STEP_LABELS,
} from './useScheduleFoodFlow';
import styles from './ScheduleFoodCreateModals.module.scss';

type Props = {
  scheduleId: string;
  richNutrient?: { id: string; unit: string } | null;
  onRichNutrientClear?: () => void;
};

const ScheduleFoodCreateModals = ({ scheduleId, richNutrient, onRichNutrientClear }: Props) => {
  const {
    step,
    setStep,
    draft,
    setDraft,
    sessionKey,
    handleFocusCapture,
    handleClose,
    handleTimeFinish,
    handleFoodSelect,
    handlePickCreate,
    handleConfirmCreate,
    handleCommit,
    quantityContent,
    inputIds: { TIME_INPUT, SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT, CREATE_INPUT },
  } = useScheduleFoodFlow({ type: 'create', scheduleId, richNutrient, onRichNutrientClear });

  const hasHints = useHasDetailsHints(draft.productId);
  const createSteps = hasHints ? CREATE_STEPS_WITH_DETAILS : CREATE_STEPS_NO_DETAILS;

  const goToStep = (target: typeof step) => setStep(target);

  // Local state for the create-name input. Re-synced from draft.foodName on
  // every transition INTO the 'create' step (so a fresh prefill from
  // handlePickCreate lands without clobbering mid-edit user input within the
  // same step session).
  const [createName, setCreateName] = useState('');
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== 'create' && step === 'create') {
      setCreateName(draft.foodName ?? '');
    }
    prevStepRef.current = step;
  }, [step, draft.foodName]);

  const createVariantLabel = draft.variant === 'dish' ? 'блюдо' : 'продукт';
  const createTrimmed = createName.trim();

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Search */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <SearchFood
            onInfoClick={() => {
              handleClose();
            }}
            key={sessionKey}
            mode="products-and-dishes"
            richNutrient={richNutrient}
            onSelectFood={handleFoodSelect}
            onBack={handleClose}
            activeItemId={draft.productId ?? draft.dishId ?? undefined}
            itemHtmlFor={TIME_INPUT}
            inputId={SEARCH_INPUT}
            isActive={step === 'search'}
            createInputHtmlFor={CREATE_INPUT}
            onPickCreate={handlePickCreate}
          />
        }
      />

      {/* Step 1a: Create product/dish — opened from the "Нет нужного…" labels
          inside SearchFood. Confirm is a <label htmlFor={TIME_INPUT}> so the
          step transition to 'time' happens via onFocusCapture after focus
          delegation lands. */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'create'}
        content={
          <ModalShell variant="spring2">
            <ModalShell.Body>
              <div className={styles.createBody}>
                <h2 className={styles.createTitle}>Новый {createVariantLabel}</h2>
                <TextInput
                  id={CREATE_INPUT}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={`Название ${createVariantLabel === 'блюдо' ? 'блюда' : 'продукта'}`}
                  fullWidth
                  autoComplete="off"
                />
                <p className={styles.createHint}>
                  Сейчас создадим — детали можно будет добавить позже.
                </p>
              </div>
              <ModalShell.ActionButtons
                debugId="create-name"
                left={<ModalPrevButton as="label" htmlFor={SEARCH_INPUT} />}
                right={
                  createTrimmed ? (
                    <ModalNextButton
                      as="label"
                      htmlFor={TIME_INPUT}
                      onClick={() => handleConfirmCreate(createName)}
                      label="Создать"
                    />
                  ) : (
                    <ModalNextButton onClick={() => {}} label="Создать" disabled />
                  )
                }
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 2: Time */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell variant="gradient1">
            <ModalStepHeader
              currentStep="time"
              steps={createSteps}
              stepLabels={STEP_LABELS}
              stepResults={{ time: draft.time, search: draft.foodName ?? undefined }}
              onBack={handleClose}
              onStepClick={goToStep}
            />

            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={TIME_INPUT}
              />
              <ModalShell.ActionButtons
                debugId="create-time"
                right={<ModalNextButton as="label" htmlFor={QUANTITY_INPUT} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 3: Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalStepHeader
              currentStep="quantity"
              steps={createSteps}
              stepLabels={STEP_LABELS}
              stepResults={{ time: draft.time, search: draft.foodName ?? undefined }}
              onBack={handleClose}
              onStepClick={goToStep}
            />

            <ModalShell.Body>
              {(draft.productId || draft.dishId) && (
                <>
                  <ProductQuantity
                    key={sessionKey}
                    content={quantityContent}
                    onFinish={() => {}}
                    inputId={QUANTITY_INPUT}
                    isActive={step === 'quantity'}
                  />
                  {hasHints ? (
                    <ModalShell.ActionButtons
                      debugId="create-qty"
                      right={<ModalNextButton as="label" htmlFor={DETAILS_INPUT} />}
                    />
                  ) : (
                    <ModalShell.ActionButtons
                      debugId="create-qty"
                      left={
                        <label htmlFor={DETAILS_INPUT} className={styles.detailsOptIn}>
                          + деталь
                        </label>
                      }
                      right={<ModalNextButton onClick={handleCommit} variant="finish" />}
                    />
                  )}
                </>
              )}
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 4: Details */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'details'}
        content={
          <ModalShell variant="spring">
            <ModalStepHeader
              currentStep="details"
              steps={createSteps.includes('details') ? createSteps : CREATE_STEPS_WITH_DETAILS}
              stepLabels={STEP_LABELS}
              stepResults={{
                time: draft.time,
                search: draft.foodName ?? undefined,
                quantity: draft.quantity,
              }}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <ModalShell.Body>
              <DetailsChips
                textareaId={DETAILS_INPUT}
                value={draft.details}
                onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
                productId={draft.productId}
              />
              <ModalShell.ActionButtons
                debugId="create-details"
                left={<ModalPrevButton onClick={() => goToStep('quantity')} />}
                right={<ModalNextButton onClick={handleCommit} variant="finish" />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleFoodCreateModals;
