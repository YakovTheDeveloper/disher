import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { DetailsNoteButton } from '@/features/shared/components/DetailsNoteButton';
import { useScheduleFoodFlow, CREATE_STEPS, STEP_LABELS } from './useScheduleFoodFlow';

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
            bottomLeft={<DetailsNoteButton htmlFor={DETAILS_INPUT} hasDetails={!!draft.details} />}
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
              steps={CREATE_STEPS}
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
              steps={CREATE_STEPS}
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
                  <ModalShell.ActionButtons
                    debugId="create-qty"
                    right={<ModalNextButton onClick={handleCommit} />}
                  />
                </>
              )}
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Details (optional, side-step) */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'details'}
        content={
          <ModalShell variant="spring">
            <ModalShell.Body>
              <ModalShell.Title>
                {draft.foodName
                  ? `Уточнение: ${draft.foodName}`
                  : 'Уточнение к приему пищи'}
              </ModalShell.Title>
              <Textarea
                id={DETAILS_INPUT}
                value={draft.details}
                onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
                placeholder="Заметка к записи..."
                rows={3}
                maxLength={500}
                debounceTime={0}
              />
              {step === 'details' && (
                <ModalShell.ActionButtons
                  debugId="create-details"
                  left={<ModalPrevButton onClick={() => goToStep('search')} />}
                  right={<ModalNextButton onClick={() => goToStep('search')} />}
                />
              )}
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleFoodCreateModals;
