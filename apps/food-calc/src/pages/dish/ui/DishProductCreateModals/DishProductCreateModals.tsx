import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { useDishProductFlow, CREATE_STEPS, STEP_LABELS } from '../useDishProductFlow';

type Props = {
  dishId: string;
};

const DishProductCreateModals = ({ dishId }: Props) => {
  const {
    step,
    setStep,
    draft,
    sessionKey,
    handleFocusCapture,
    handleClose,
    handleFoodSelect,
    handleCommit,
    quantityContent,
    inputIds: { SEARCH_INPUT, QUANTITY_INPUT },
  } = useDishProductFlow({ type: 'create', dishId });

  const goToStep = (target: typeof step) => setStep(target);

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Search */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <ModalShell>
            <ModalStepHeader
              currentStep="search"
              steps={CREATE_STEPS}
              stepLabels={STEP_LABELS}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <SearchFood
              key={sessionKey}
              mode="products-only"
              onSelectFood={handleFoodSelect}
              onInfoClick={() => {
                handleClose();
              }}
              activeItemId={draft.productId ?? undefined}
              itemHtmlFor={QUANTITY_INPUT}
              inputId={SEARCH_INPUT}
            />
          </ModalShell>
        }
      />

      {/* Step 2: Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalStepHeader
              currentStep="quantity"
              steps={CREATE_STEPS}
              stepLabels={STEP_LABELS}
              onBack={handleClose}
              onStepClick={goToStep}
            />

            <ModalShell.Body>
              {draft.productId && (
                <>
                  <ProductQuantity
                    key={sessionKey}
                    content={quantityContent}
                    onFinish={() => {}}
                    inputId={QUANTITY_INPUT}
                  />
                  <ModalShell.ActionButtons
                    left={<ModalPrevButton onClick={() => goToStep('search')} />}
                    right={<ModalNextButton onClick={handleCommit} />}
                  />
                </>
              )}
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default DishProductCreateModals;
