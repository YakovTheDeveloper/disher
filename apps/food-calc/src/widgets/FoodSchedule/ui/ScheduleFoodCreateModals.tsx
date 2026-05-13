import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
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
    handleCommit,
    quantityContent,
    inputIds: { TIME_INPUT, SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT },
  } = useScheduleFoodFlow({ type: 'create', scheduleId, richNutrient, onRichNutrientClear });

  const hasHints = useHasDetailsHints(draft.productId);
  const createSteps = hasHints ? CREATE_STEPS_WITH_DETAILS : CREATE_STEPS_NO_DETAILS;

  const goToStep = (target: typeof step) => setStep(target);

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
          />
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
