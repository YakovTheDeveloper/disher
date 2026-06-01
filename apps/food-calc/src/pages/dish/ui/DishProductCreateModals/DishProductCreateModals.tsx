import { useEffect, useRef, useState } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalByLabelDetails } from '@/features/shared/components/ModalByLabelDetails';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { useProduct } from '@/entities/product';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
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
    handlePickCreate,
    handleConfirmCreate,
    handleCommit,
    quantityContent,
    visitedSteps,
    inputIds: { SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT, CREATE_INPUT },
  } = useDishProductFlow({ type: 'create', dishId });

  // Local state для инпута создания — пересинкивается из draft.foodName при
  // каждом входе в шаг 'create' (свежий prefill из handlePickCreate не должен
  // затирать редактирование внутри той же сессии шага).
  const [createName, setCreateName] = useState('');
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== 'create' && step === 'create') {
      setCreateName(draft.foodName ?? '');
    }
    prevStepRef.current = step;
  }, [step, draft.foodName]);

  const handleBackToSearch = () => setStep('search');
  const createTrimmed = createName.trim();

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

  // «Назад» в StepHeader — на предыдущий шаг по линейному порядку stepsForBar
  // (тот же массив, что отрисован в bar; включает opt-in `details` если шаг
  // уже посещён). Первый шаг (search) рисуется голым SearchFood со своим
  // onBack=handleClose; первый шаг с StepHeader — quantity, его back ведёт
  // на search.
  const handleBack = () => {
    const idx = stepsForBar.indexOf(step as (typeof stepsForBar)[number]);
    if (idx <= 0) {
      handleClose();
      return;
    }
    setStep(stepsForBar[idx - 1]);
  };

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
            isActive={step === 'search'}
            createInputHtmlFor={CREATE_INPUT}
            onPickCreate={handlePickCreate}
          />
        }
      />

      {/* Step 1a: Create product — opened from «+ Продукт» pill в SearchFood
          empty-state. Confirm = <label htmlFor={QUANTITY_INPUT}>; шаг 'quantity'
          выставляется через onFocusCapture после делегирования фокуса
          (см. CLAUDE.md «Label focus delegation»). */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'create'}
        content={
          <ModalShell variant="spring2">
            <ModalShell.Header title="Новый продукт" onBack={handleBackToSearch} />
            <ModalShell.Body>
              <AutoGrowSearch
                singleLine
                id={CREATE_INPUT}
                value={createName}
                onChange={setCreateName}
                placeholder="Название продукта"
                autoComplete="off"
              />
              <ModalShell.ActionButtons
                debugId="dish-create-name"
                right={
                  createTrimmed ? (
                    <ModalNextButton
                      as="label"
                      htmlFor={QUANTITY_INPUT}
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
              onBack={handleBack}
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
      <ModalByLabelDetails
        isExpanded={step === 'details'}
        variant="spring2"
        onCommit={handleCommit}
        header={
          <ModalShell.StepHeader
            title={STEP_LABELS.details}
            currentStep="details"
            steps={stepsForBar}
            stepLabels={STEP_LABELS}
            stepResults={stepResults}
            visitedSteps={visitedSteps}
            onBack={handleBack}
            onStepClick={goToStep}
          />
        }
      >
        <DetailsChips
          textareaId={DETAILS_INPUT}
          value={draft.details}
          onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
          productId={draft.productId}
        />
      </ModalByLabelDetails>
    </div>
  );
};

export default DishProductCreateModals;
