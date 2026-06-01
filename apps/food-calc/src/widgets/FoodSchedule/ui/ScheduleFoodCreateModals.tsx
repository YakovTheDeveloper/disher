import { useEffect, useRef, useState } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalByLabelDetails } from '@/features/shared/components/ModalByLabelDetails';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import LabeledCheckbox from '@/shared/ui/LabeledCheckbox/LabeledCheckbox';
import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientCardEditor } from '@/entities/nutrient/ui/NutrientCard';
import { DetailsStep, useHasDetailsHints } from '@/features/food/details-chips';
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
    visitedSteps,
    inputIds: { TIME_INPUT, SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT, CREATE_INPUT },
  } = useScheduleFoodFlow({ type: 'create', scheduleId, richNutrient, onRichNutrientClear });

  const hasHints = useHasDetailsHints(draft.productId);
  const createSteps = hasHints ? CREATE_STEPS_WITH_DETAILS : CREATE_STEPS_NO_DETAILS;

  // Один список шагов на ВСЕ StepHeader флоу. `details` — опт-ин (нет в
  // createSteps без hints), но как только шаг посещён, он должен остаться
  // в строке на всех шагах — иначе крошка «Особенности» пропадает при
  // прыжке назад (трейл «тасуется»).
  const stepsForBar =
    visitedSteps.includes('details') && !createSteps.includes('details')
      ? [...createSteps, 'details' as const]
      : createSteps;

  // Единый набор результатов для всех StepHeader флоу. Какие крошки реально
  // показать — решает `visitedSteps` в Breadcrumbs, а не подмножество здесь
  // (раньше шаг quantity не отдавал свой результат и не появлялся в трейле).
  const stepResults = {
    time: draft.time,
    search: draft.foodName ?? undefined,
    quantity: draft.quantity,
    details: draft.details.trim() || undefined,
  };

  const goToStep = (target: typeof step) => setStep(target);

  // «Назад» в StepHeader — на предыдущий шаг по линейному порядку stepsForBar
  // (тот же массив, что отрисован в bar; включает opt-in `details` если шаг
  // уже посещён). На первом шаге с StepHeader (time) back ведёт на search;
  // search рисуется голым SearchFood со своим onBack=handleClose. Если шага
  // нет в наборе (краевой случай) — закрываем флоу целиком.
  const handleBack = () => {
    const idx = stepsForBar.indexOf(step as (typeof stepsForBar)[number]);
    if (idx <= 0) {
      handleClose();
      return;
    }
    setStep(stepsForBar[idx - 1]);
  };

  // «Назад» с экрана создания продукта/блюда — возврат к поиску (это не
  // Steps-bar модалка, а ответвление из SearchFood).
  const handleBackToSearch = () => setStep('search');

  // Local state for the create-name input. Re-synced from draft.foodName on
  // every transition INTO the 'create' step (so a fresh prefill from
  // handlePickCreate lands without clobbering mid-edit user input within the
  // same step session).
  const [createName, setCreateName] = useState('');
  const [isSupplement, setIsSupplement] = useState(false);
  // БАД-only: введённые в модалке нутриенты per 1 шт.
  // Аккордеоны по дефолту свёрнуты, single-open — открыта максимум одна группа.
  // Тап другой → предыдущая сворачивается (экран не превращается в длинный
  // скролл из ~70 карточек).
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [supplementNutrients, setSupplementNutrients] = useState<Record<string, number>>({});

  const toggleGroup = (name: string) => {
    setOpenGroup((prev) => (prev === name ? null : name));
  };
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== 'create' && step === 'create') {
      setCreateName(draft.foodName ?? '');
      setIsSupplement(false);
      setOpenGroup(null);
      setSupplementNutrients({});
    }
    prevStepRef.current = step;
  }, [step, draft.foodName]);

  const handleNutrientChange = (nutrientId: string, value: number) => {
    setSupplementNutrients((prev) => {
      const next = { ...prev };
      if (value === 0) delete next[nutrientId];
      else next[nutrientId] = value;
      return next;
    });
  };

  const createVariantLabel = draft.variant === 'dish' ? 'блюдо' : 'продукт';
  const createTrimmed = createName.trim();
  const isProductCreate = draft.variant !== 'dish';

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
            title="Еда"
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
          <ModalShell variant="spring4">
            <ModalShell.Header
              title={createVariantLabel === 'блюдо' ? 'Новое блюдо' : 'Новый продукт'}
              onBack={handleBackToSearch}
            />
            <ModalShell.Body>
              <div className={styles.createBody}>
                <AutoGrowSearch
                  singleLine
                  id={CREATE_INPUT}
                  value={createName}
                  onChange={setCreateName}
                  placeholder={`Название ${createVariantLabel === 'блюдо' ? 'блюда' : 'продукта'}`}
                  autoComplete="off"
                />
                <p className={styles.createHint}>
                  Сейчас создадим — детали можно будет добавить позже.
                </p>
                {isProductCreate && (
                  <div className={styles.createSupplementRow}>
                    <LabeledCheckbox
                      checked={isSupplement}
                      onChange={setIsSupplement}
                      label="Таблетка / лекарство / БАД"
                    />
                  </div>
                )}
                {isProductCreate && isSupplement && (
                  <div className={styles.supplementBlock}>
                    <p className={styles.supplementUnit}>1 приём = 1 шт</p>
                    <div className={styles.nutrientGroupsList}>
                      {nutrientGroups.map((group) => {
                        const isOpen = openGroup === group.name;
                        const filledCount = group.content.filter(
                          (n) => (supplementNutrients[n.id] ?? 0) > 0,
                        ).length;
                        return (
                          <div
                            key={group.name}
                            data-group={group.name}
                            className={`${styles.nutrientGroupItem} ${isOpen ? styles.nutrientGroupOpen : ''}`}
                          >
                            <button
                              type="button"
                              className={styles.nutrientsToggle}
                              onClick={() => toggleGroup(group.name)}
                              aria-expanded={isOpen}
                            >
                              <span>
                                {isOpen ? '−' : '+'} {group.displayName}
                              </span>
                              <span className={styles.nutrientsToggleHint}>
                                {filledCount > 0 ? `${filledCount} запис.` : 'per 1 шт'}
                              </span>
                            </button>
                            {isOpen && (
                              <div className={styles.nutrientsGrid}>
                                {group.content.map((nutrientData) => (
                                  <NutrientCardEditor
                                    key={nutrientData.id}
                                    content={nutrientData}
                                    variant="product-edit"
                                    className={styles.inlineCard}
                                    editValue={supplementNutrients[nutrientData.id] ?? 0}
                                    onValueChange={handleNutrientChange}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <ModalShell.ActionButtons
                debugId="create-name"
                right={
                  createTrimmed ? (
                    <ModalNextButton
                      as="label"
                      htmlFor={TIME_INPUT}
                      onClick={() =>
                        handleConfirmCreate(createName, {
                          isSupplement,
                          nutrients: isSupplement ? supplementNutrients : undefined,
                        })
                      }
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
          <ModalShell variant="spring4">
            <ModalShell.StepHeader
              title={STEP_LABELS.time}
              currentStep="time"
              steps={stepsForBar}
              stepLabels={STEP_LABELS}
              stepResults={stepResults}
              visitedSteps={visitedSteps}
              onBack={handleBack}
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
          <ModalShell variant="spring4">
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
      <ModalByLabelDetails
        isExpanded={step === 'details'}
        variant="spring4"
        flush
        debugId="create-details"
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
        <DetailsStep
          textareaId={DETAILS_INPUT}
          value={draft.details}
          onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
          productId={draft.productId}
        />
      </ModalByLabelDetails>
    </div>
  );
};

export default ScheduleFoodCreateModals;
