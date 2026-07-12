import { useEffect, useRef, useState } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalByLabelDetails } from '@/features/shared/components/ModalByLabelDetails';
import { SearchFood, useSearchHeaderContent, searchFoodStyles } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import { FormLayout } from '@/shared/ui/form/FormLayout';
import { FoodHintButton } from '@/shared/ui/FoodHintButton';
import LabeledCheckbox from '@/shared/ui/LabeledCheckbox/LabeledCheckbox';
import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientCardEditor } from '@/entities/nutrient/ui/NutrientCard';
import { DetailsStep, useHasDetailsHints } from '@/features/food/details-chips';
import { Accordion } from '@/shared/ui/Accordion';
import { Text } from '@/shared/ui/atoms/Typography';
import {
  type FoodEntryFlow,
  CREATE_STEPS_WITH_DETAILS,
  CREATE_STEPS_NO_DETAILS,
  STEP_LABELS,
} from './useFoodEntryFlow';
import styles from './FoodEntryCreateModals.module.scss';

type Props = {
  /** Create-флоу, поднятый страницей (useFoodEntryFlow({ mode: 'create', target })). */
  flow: FoodEntryFlow;
};

const FoodEntryCreateModals = ({ flow }: Props) => {
  const {
    kind,
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
  } = flow;

  // У блюда в блюдо нельзя класть блюдо → products-only; в день можно добавить
  // целое блюдо → products-and-dishes.
  const searchMode = kind === 'dish' ? 'products-only' : 'products-and-dishes';

  // Заголовок шага поиска (ModalHeader внутри SearchFood). Блюдо → статичный
  // «Добавить продукт»; расписание → «Выбор еды». Дата-мета убрана (запрос юзера
  // 2026-07-10) — заголовок центрируется по полосе (titleAlign="center"). При
  // активном нутриент-фильтре SearchFood сам перебивает заголовок именем нутриента.
  const searchTitle = kind === 'dish' ? 'Добавить продукт' : 'Выбор еды';
  // Тайтл хедера поиска: при активном нутриент-фильтре имя нутриента перебивает
  // статичный тайтл (логика жила в SearchFood, поднята сюда вместе с выносом хедера
  // на уровень ModalShell).
  const searchHeader = useSearchHeaderContent(searchTitle);

  const hasHints = useHasDetailsHints(draft.productId);
  const createSteps = hasHints ? CREATE_STEPS_WITH_DETAILS : CREATE_STEPS_NO_DETAILS;

  // Один список шагов на ВСЕ StepHeader флоу. `details` — опт-ин (нет в
  // createSteps без hints), но как только шаг посещён, он остаётся в строке на
  // всех шагах — иначе крошка «Особенности» пропадает при прыжке назад.
  const stepsForBar =
    visitedSteps.includes('details') && !createSteps.includes('details')
      ? [...createSteps, 'details' as const]
      : createSteps;

  const stepResults = {
    search: draft.foodName ?? undefined,
    quantity: draft.quantity,
    details: draft.details.trim() || undefined,
  };

  const goToStep = (target: typeof step) => setStep(target);

  // «Назад» в StepHeader — на предыдущий шаг по линейному порядку stepsForBar.
  // На первом шаге с StepHeader (quantity) back ведёт на search; search рисуется
  // голым SearchFood со своим onBack=handleClose.
  const handleBack = () => {
    const idx = stepsForBar.indexOf(step as (typeof stepsForBar)[number]);
    if (idx <= 0) {
      handleClose();
      return;
    }
    setStep(stepsForBar[idx - 1]);
  };

  // «Назад» с экрана создания продукта/блюда — возврат к поиску.
  const handleBackToSearch = () => setStep('search');

  // Local state шага создания имени. Пересинкивается из draft.foodName при
  // каждом входе в 'create' (свежий prefill из handlePickCreate не должен
  // затирать редактирование внутри той же сессии шага).
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [isSupplement, setIsSupplement] = useState(false);
  // Состав создаваемого продукта: nutrient-id → количество на базис. Базис задаёт
  // галочка «Таблетка»: снята → на 100 г (еда), стоит → на 1 шт (приём). Блок
  // общий для любого продукта — состав больше НЕ привязан к таблетке (2026-07-11).
  // Аккордеоны групп single-open.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [draftNutrients, setDraftNutrients] = useState<Record<string, number>>({});
  // Опт-ин раскрытия блока состава: секция нутриентов не громоздится всегда, а
  // появляется по галочке «Указать состав» (прогрессивное раскрытие).
  const [wantComposition, setWantComposition] = useState(false);

  const toggleGroup = (name: string) => {
    setOpenGroup((prev) => (prev === name ? null : name));
  };

  const handleToggleComposition = (next: boolean) => {
    setWantComposition(next);
    if (!next) {
      setDraftNutrients({});
      setOpenGroup(null);
    }
  };
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== 'create' && step === 'create') {
      setCreateName(draft.foodName ?? '');
      setCreateDescription('');
      setIsSupplement(false);
      setOpenGroup(null);
      setDraftNutrients({});
      setWantComposition(false);
    }
    prevStepRef.current = step;
  }, [step, draft.foodName]);

  const handleNutrientChange = (nutrientId: string, value: number) => {
    setDraftNutrients((prev) => {
      const next = { ...prev };
      if (value === 0) delete next[nutrientId];
      else next[nutrientId] = value;
      return next;
    });
  };

  const createVariantLabel = draft.variant === 'dish' ? 'блюдо' : 'продукт';
  const createTrimmed = createName.trim();
  // БАД-блок — только в РАСПИСАНИИ при создании продукта. В блюде БАД запрещён:
  // dish-калькулятор считает нутриенты в граммах (per-100g), serving-продукт дал
  // бы неверную сумму → БАД не создаём и не ищем в блюде (2026-06-20).
  const showSupplementOption = kind === 'schedule' && draft.variant !== 'dish';

  // Блок «Состав» — для ЛЮБОГО создаваемого продукта (еда per-100 г или таблетка
  // per-1 шт), не только для БАД. У блюда прямого состава нет (оно считается из
  // ингредиентов) → только вариант 'product'. Работает на обоих таргетах: продукт
  // в блюде тоже получает состав per-100 г (dish-калькулятор его суммирует).
  const canComposition = draft.variant === 'product';
  const compositionBasisLabel = isSupplement ? '1 приём = 1 шт' : 'на 100 г';

  // Сегмент «Продукт | Блюдо» в модалке создания — только в расписании. В блюдо
  // блюдо не вкладывается → на dish-таргете (DishBuilderPage) вариант всегда
  // product, сегмент не рендерим. Смена типа сбрасывает БАД-конфиг: он валиден
  // только для продукта (handleConfirmCreate его игнорирует для блюда, но stale
  // isSupplement выставил бы quantity=1).
  const showVariantSegment = kind === 'schedule';
  const handleVariantChange = (next: string) => {
    const variant = next === 'dish' ? 'dish' : 'product';
    setDraft((d) => ({ ...d, variant, productId: null, dishId: null }));
    setIsSupplement(false);
    setDraftNutrients({});
    setOpenGroup(null);
    setWantComposition(false);
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Search */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          // SearchFood в общей раме ModalShell (как create/quantity шаги): одна
          // поверхность + backdrop + gutter обёртки. Хедер поиска — ПРЯМОЙ ребёнок
          // <ModalShell> (симметрия с шагами), список еды инсетится тем же боковым
          // паддингом рамы (iOS inset-grouped). railHost на обёртке хостит общую
          // рельсу --rail-* для хедера-соседа и списка.
          <ModalShell className={searchFoodStyles.railHost}>
            <ModalShell.Header
              title={searchHeader.title}
              onBack={handleClose}
              titleAlign="center"
            />
            <SearchFood
              onInfoClick={() => {
                handleClose();
              }}
              key={sessionKey}
              mode={searchMode}
              onSelectFood={handleFoodSelect}
              activeItemId={draft.productId ?? draft.dishId ?? undefined}
              itemHtmlFor={QUANTITY_INPUT}
              inputId={SEARCH_INPUT}
              isActive={step === 'search'}
              createInputHtmlFor={CREATE_INPUT}
              onPickCreate={handlePickCreate}
              excludeSupplements={kind === 'dish'}
            />
          </ModalShell>
        }
      />

      {/* Step 1a: Create product/dish — opened from the "Нет нужного…" labels
          inside SearchFood. Confirm = <label htmlFor={QUANTITY_INPUT}> so the
          step transition to 'quantity' happens via onFocusCapture after focus
          delegation lands (шаг времени убран — время = «сейчас» на коммите). */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'create'}
        content={
          <ModalShell>
            <ModalShell.Header title="Создать еду" onBack={handleBackToSearch} />
            <ModalShell.Body>
              <FormLayout>
                <FormLayout.Group label="Название" htmlFor={CREATE_INPUT}>
                  <AutoGrowSearch
                    singleLine
                    id={CREATE_INPUT}
                    value={createName}
                    onChange={setCreateName}
                    placeholder={`Название ${createVariantLabel === 'блюдо' ? 'блюда' : 'продукта'}`}
                    autoComplete="off"
                  />
                </FormLayout.Group>

                {/* Описание — общее для продукта и блюда, необязательное. id вне
                    INPUT_TO_STEP → фокус на нём не переключает шаг (early-return
                    в handleFocusCapture). Мультилайн: без singleLine. Кнопка-инфо
                    в трейлинге лейбла — только где еда МОЖЕТ быть БАД
                    (showSupplementOption): в блюде/ингредиенте БАД нет. */}
                <FormLayout.Group
                  label="Описание"
                  htmlFor={`${CREATE_INPUT}-desc`}
                  trailing={
                    showSupplementOption ? (
                      // Размер плитки ⓘ = высота строки лейбла (16px × 1.2 ≈ 20),
                      // иначе тайл выше текста и распирает ряд-заголовок группы.
                      <FoodHintButton tone="soft" size={20} glyphSize={15} />
                    ) : undefined
                  }
                >
                  <AutoGrowSearch
                    id={`${CREATE_INPUT}-desc`}
                    value={createDescription}
                    onChange={setCreateDescription}
                    placeholder="Подробности (необяз.)"
                    maxLength={2000}
                    autoComplete="off"
                  />
                </FormLayout.Group>

                {showVariantSegment && (
                  <FormLayout.Group label="Какая это еда?">
                    <ChoiceGroup
                      orientation="horizontal"
                      elevation="raised"
                      value={draft.variant}
                      onChange={handleVariantChange}
                      aria-label="Тип: продукт или блюдо"
                      className={styles.variantRow}
                    >
                      <ChoiceItem className={styles.variantCell} value="product" stacked>
                        <Text as="span" role="label" className={styles.variantTitle}>
                          Продукт
                        </Text>
                        <Text as="span" role="caption" className={styles.variantHint}>
                          Отдельная еда с единым составом: яблоко, миндаль, карп
                        </Text>
                      </ChoiceItem>
                      <ChoiceItem className={styles.variantCell} value="dish" stacked>
                        <Text as="span" role="label" className={styles.variantTitle}>
                          Блюдо
                        </Text>
                        <Text as="span" role="caption" className={styles.variantHint}>
                          Рецепт из нескольких продуктов: салат, суп
                        </Text>
                      </ChoiceItem>
                    </ChoiceGroup>
                  </FormLayout.Group>
                )}
                {showSupplementOption && (
                  <div className={styles.createSupplementRow}>
                    <LabeledCheckbox
                      checked={isSupplement}
                      onChange={setIsSupplement}
                      label="Таблетка / лекарство / БАД"
                    />
                  </div>
                )}
                {canComposition && (
                  // Галочка + панель состава = ОДНО целое: единый well-контейнер,
                  // галочка = его верхний ряд (без своей пилюли), список групп течёт
                  // ниже через rail-шов, без зазора. Базис («на 100 г» / «1 шт») — в
                  // правом крае галочки, только когда включено.
                  <div
                    className={`${styles.compositionBlock} ${wantComposition ? styles.compositionOpen : ''}`}
                  >
                    <LabeledCheckbox
                      bare
                      checked={wantComposition}
                      onChange={handleToggleComposition}
                      label="Указать состав"
                      trailing={wantComposition ? compositionBasisLabel : undefined}
                    />
                    {wantComposition && (
                      <div className={styles.supplementBlock}>
                      {nutrientGroups.map((group) => {
                        const isOpen = openGroup === group.name;
                        const filledCount = group.content.filter(
                          (n) => (draftNutrients[n.id] ?? 0) > 0
                        ).length;
                        return (
                          // Примитив Accordion. lazyMount — тело монтируется только
                          // пока открыто: групп 4 (до 19 карточек каждая) и always-
                          // mount всех сразу зря крутил бы ~54 NutrientCardEditor;
                          // iOS-делегация тут не страдает (тоггл — button, label→
                          // input самодостаточны внутри карточки), поэтому lazy
                          // безопасен. Кликабельность несёт вращающийся шеврон.
                          <Accordion
                            key={group.name}
                            open={isOpen}
                            onToggle={() => toggleGroup(group.name)}
                            lazyMount
                            className={`${styles.nutrientGroupItem} ${isOpen ? styles.nutrientGroupOpen : ''}`}
                            headerClassName={styles.nutrientsToggle}
                            bodyClassName={styles.nutrientsGrid}
                            title={
                              <Text as="span" role="label" className={styles.nutrientsToggleTitle}>
                                {group.displayName}
                              </Text>
                            }
                            trailing={
                              filledCount > 0 ? (
                                <Text as="span" role="caption" className={styles.nutrientsToggleHint}>
                                  {filledCount} запис.
                                </Text>
                              ) : null
                            }
                          >
                            {group.content.map((nutrientData) => (
                              <NutrientCardEditor
                                key={nutrientData.id}
                                content={nutrientData}
                                variant="product-edit"
                                className={styles.inlineCard}
                                editValue={draftNutrients[nutrientData.id] ?? 0}
                                onValueChange={handleNutrientChange}
                              />
                            ))}
                          </Accordion>
                        );
                      })}
                      </div>
                    )}
                  </div>
                )}
              </FormLayout>
              {/* Резерв прокрутки под фикс-бар «Создать» (keyboard-stick) —
                  канонический примитив ModalShell.Spacer, а не хардкод-padding
                  в этой имплементации (величина резерва живёт в шелле). */}
              <ModalShell.Spacer />
              <ModalShell.ActionButtons
                debugId="create-name"
                right={
                  createTrimmed ? (
                    <ModalNextButton
                      as="label"
                      htmlFor={QUANTITY_INPUT}
                      onClick={() =>
                        handleConfirmCreate(createName, {
                          isSupplement,
                          // Состав пишется для любого продукта (базис задаёт
                          // isSupplement: 100 г / 1 шт), не только для БАД.
                          nutrients:
                            Object.keys(draftNutrients).length > 0 ? draftNutrients : undefined,
                          description: createDescription.trim() || undefined,
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
              active={step === 'quantity'}
            />

            <ModalShell.Body>
              {(draft.productId || draft.dishId) && (
                <>
                  <ProductQuantity
                    key={sessionKey}
                    content={quantityContent}
                    unit={quantityContent.unit}
                    resetKey={draft.productId ?? draft.dishId ?? ''}
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
                        <Text
                          as="label"
                          role="body"
                          htmlFor={DETAILS_INPUT}
                          className={styles.detailsOptIn}
                        >
                          + деталь
                        </Text>
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
            active={step === 'details'}
          />
        }
      >
        <DetailsStep
          textareaId={DETAILS_INPUT}
          value={draft.details}
          onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
          productId={draft.productId}
          // Хост = ModalShell (surface-0, бежевый стол) → чип резолвится в светлый тир 1.
          surface={0}
        />
      </ModalByLabelDetails>
    </div>
  );
};

export default FoodEntryCreateModals;
