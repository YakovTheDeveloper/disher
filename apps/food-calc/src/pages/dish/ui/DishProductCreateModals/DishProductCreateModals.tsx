import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { useProduct } from '@/entities/product';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
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
    visitedSteps,
    inputIds: { SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT },
  } = useDishProductFlow({ type: 'create', dishId });

  const hasHints = useHasDetailsHints(draft.productId);
  const createSteps = hasHints ? CREATE_STEPS_WITH_DETAILS : CREATE_STEPS_NO_DETAILS;

  // Один список шагов на ВСЕ StepHeader флоу. `details` — опт-ин; как только
  // шаг посещён, он остаётся в строке на всех шагах, иначе крошка пропадает
  // при прыжке назад (трейл «тасуется»).
  const stepsForBar =
    visitedSteps.includes('details') && !createSteps.includes('details')
      ? [...createSteps, 'details' as const]
      : createSteps;

  const goToStep = (target: typeof step) => setStep(target);

  // `results`-вид Breadcrumbs показывает результаты пройденных шагов.
  // Имя продукта флоу в draft не хранит — берём из каталога/Dexie по id.
  const selectedProduct = useProduct(draft.productId ?? undefined);
  const stepResults = {
    search: selectedProduct?.name ?? undefined,
    quantity: draft.quantity,
    details: draft.details.trim() || undefined,
  };

  // Стрелка «назад» в модалках со Steps bar закрывает весь флоу: вернуться на
  // пройденный шаг можно кликом по табу в Steps, отдельная step-−1 не нужна.

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Search — единый бар [← Еда 🔍], как на HomePage. Полоса
          шагов на шаге поиска не нужна: продвинуться можно только выбрав
          продукт, а вернуться сюда — кликом по «Поиск» в Steps других шагов. */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <SearchFood
            key={sessionKey}
            mode="products-only"
            title="Еда"
            onSelectFood={handleFoodSelect}
            onBack={handleClose}
            onInfoClick={() => {
              handleClose();
            }}
            activeItemId={draft.productId ?? undefined}
            itemHtmlFor={QUANTITY_INPUT}
            inputId={SEARCH_INPUT}
          />
        }
      />

      {/* Step 2: Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalShell.StepHeader
              title={STEP_LABELS.quantity}
              currentStep="quantity"
              steps={stepsForBar}
              stepLabels={STEP_LABELS}
              stepResults={stepResults}
              visitedSteps={visitedSteps}
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
            <ModalShell.StepHeader
              title={STEP_LABELS.details}
              currentStep="details"
              steps={stepsForBar}
              stepLabels={STEP_LABELS}
              stepResults={stepResults}
              visitedSteps={visitedSteps}
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
