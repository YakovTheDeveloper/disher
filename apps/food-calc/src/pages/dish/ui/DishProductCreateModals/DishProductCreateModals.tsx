import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { DetailsChips, useHasDetailsHints } from '@/features/food/details-chips';
import {
  useDishProductFlow,
  CREATE_STEPS_WITH_DETAILS,
  CREATE_STEPS_NO_DETAILS,
  STEP_LABELS,
} from '../useDishProductFlow';
import styles from './DishProductCreateModals.module.scss';

type Props = {
  dishId: string;
};

const DishProductCreateModals = ({ dishId }: Props) => {
  const {
    step,
    setStep,
    draft,
    setDraft,
    sessionKey,
    handleFocusCapture,
    handleClose,
    handleFoodSelect,
    handleCommit,
    quantityContent,
    inputIds: { SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT },
  } = useDishProductFlow({ type: 'create', dishId });

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
          <ModalShell>
            <ModalStepHeader
              currentStep="search"
              steps={createSteps}
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
              steps={createSteps}
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
                  {hasHints ? (
                    <ModalShell.ActionButtons
                      left={<ModalPrevButton onClick={() => goToStep('search')} />}
                      right={<ModalNextButton as="label" htmlFor={DETAILS_INPUT} />}
                    />
                  ) : (
                    <ModalShell.ActionButtons
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

      {/* Step 3: Details */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'details'}
        content={
          <ModalShell variant="spring">
            <ModalStepHeader
              currentStep="details"
              steps={createSteps.includes('details') ? createSteps : CREATE_STEPS_WITH_DETAILS}
              stepLabels={STEP_LABELS}
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

export default DishProductCreateModals;
