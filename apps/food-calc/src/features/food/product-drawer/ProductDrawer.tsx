import { useState, useMemo, useCallback, type FocusEvent } from 'react';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import {
  useProduct,
  useProductPortions,
  useProductNutrients,
  setProductNutrients,
  setProductPortions,
  updateProduct,
  deleteProducts,
} from '@/entities/product';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientTable } from '@/widgets/nutrients/FoodsNutrients';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { Select } from '@/shared/ui/atoms/Select';
import { Button } from '@/shared/ui/atoms/Button';
import { Accordion } from '@/shared/ui/Accordion';
import { PlusIcon } from '@/shared/ui/atoms/icons/PlusIcon';
import { DailyNormButton } from '@/features/dailyNorms/DailyNormButton';
import { FoodPortionsManager } from '@/features/food/food-portions-manager';
import { ChangeNameModal, CHANGE_NAME_INPUT_ID } from '@/features/shared/change-name';
// Импорт из конкретного файла, не из barrel: barrel реэкспортит buildInfoActions,
// который импортит ProductDrawer → иначе цикл product-drawer ↔ item-actions-drawer.
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer/ItemActionsDrawer';
import { SuggestActionButton } from '@/shared/ui/SuggestActionButton';
import { EmptyState } from '@/shared/ui/EmptyState';
import { DropdownMenu, DropdownMenuItem } from '@/shared/ui/DropdownMenu';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { drawerStore } from '@/shared/ui/drawer-store';
import { modalStore } from '@/shared/ui/modal-store';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { isCreatedByUser } from '@/shared/lib';
import { safeMutate } from '@/shared/lib/safeMutate';
import type { BaseDrawerProps } from '@/shared/ui';
import EditIcon from '@/shared/assets/icons/edit.svg?react';
import { buildQuantityOptions } from './buildQuantityOptions';
import { scaleForBasis } from './scaleForBasis';
import { SuggestNutrientsConfirmDrawer } from './SuggestNutrientsConfirmDrawer';
import { suggestProductNutrients } from './suggestProductNutrients';
import toaster from '@/shared/lib/toaster/toaster';
import { classifyError, defaultUserMessage } from '@/shared/lib/errors/classify';
import s from './ProductDrawer.module.scss';

const gramNutrientIds = new Set(
  allNutrientsList.filter((n) => n.unit === 'g').map((n) => n.id),
);

// Дефолты новой порции по «+». Юзер просил «+» сразу создавать порцию (не пустую
// строку): даём осмысленные дефолты, юзер переименовывает/меняет вес инлайн.
const DEFAULT_PORTION_BASE = 'Моя порция';
const DEFAULT_PORTION_GRAMS = 100;

type PortionItem = { label: string; grams: number };

// Уникальный дефолт-label: «Моя порция», иначе «Моя порция 2/3/…» (case-insensitive,
// единообразно с collision-check в FoodPortionsManager). Один stale-замыкание-клик
// идемпотентен (whole-array replace), а последовательные добавления не коллизят.
function nextPortionLabel(existing: PortionItem[]): string {
  const taken = new Set(existing.map((p) => p.label.trim().toLowerCase()));
  if (!taken.has(DEFAULT_PORTION_BASE.toLowerCase())) return DEFAULT_PORTION_BASE;
  let n = 2;
  while (taken.has(`${DEFAULT_PORTION_BASE} ${n}`.toLowerCase())) n++;
  return `${DEFAULT_PORTION_BASE} ${n}`;
}

interface Props extends BaseDrawerProps {
  productId: string;
  /** Имя для мгновенной шапки, пока продукт грузится из Dexie (опционально). */
  productName?: string;
}

// × выхода из режима правки — inline; currentColor.
const CloseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" className={className}>
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

type PortionsAccordionProps = {
  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
  portions: PortionItem[];
  onUpdate: (label: string, updates: Partial<PortionItem>) => void;
  onLongPressRow: (label: string) => void;
};

// Аккордеон «Порции» — сверху дровера, закрыт по умолчанию (примитив Accordion:
// шапка-тоггл + grid-reveal тело + a11y). Шапка = заголовок + счётчик (· N) +
// шеврон; голого „+“ в углу нет. «Добавить порцию» — канон Button
// (system-secondary, ведущий +) последней строкой раскрытого списка. Тап создаёт
// порцию с дефолтами и держит аккордеон раскрытым.
const PortionsAccordion = ({
  open,
  onToggle,
  onAdd,
  portions,
  onUpdate,
  onLongPressRow,
}: PortionsAccordionProps) => (
  <Accordion
    className={s.portions}
    bodyClassName={s.portionsBody}
    open={open}
    onToggle={onToggle}
    title={
      <>
        <Heading as="span" role="title">Порции</Heading>
        {portions.length > 0 && (
          <Text as="span" role="caption" className={s.portionsCount}>· {portions.length}</Text>
        )}
      </>
    }
  >
    {portions.length > 0 && (
      <FoodPortionsManager
        portions={portions}
        unit="г"
        showHint={false}
        onUpdate={onUpdate}
        onLongPressRow={onLongPressRow}
      />
    )}
    <Button
      variant="system-secondary"
      fullWidth
      icon={<PlusIcon variant="line" size={18} />}
      onClick={onAdd}
    >
      Добавить порцию
    </Button>
  </Accordion>
);

/**
 * Боковой дровер продукта — открывается из SearchFood / расписания / блюда
 * вместо страницы `/product/:id` (страница инактивирована). Полный паритет с
 * бывшей ProductPage: выбор количества + скейл, аккордеон «Порции» (свои
 * продукты-еда), подпись «мой продукт». Редактирование названия и нутриентов
 * (свои продукты) — через карандаш-попап в шапке. Каталожному продукту — только
 * нутриенты + скейл (без карандаша, порций, подписи).
 *
 * Открытие: `drawerStore.show(ProductDrawer, { productId, productName }, { side: 'left', width: 'min(85vw, 360px)' })`.
 */
export function ProductDrawer({ productId, productName, onClose }: Props) {
  const food = useProduct(productId);
  const portionsRaw = useProductPortions(productId);
  const { results: nutrientsRaw } = useProductNutrients(productId);

  // Своё значение граммов («custom»); null = дефолт по basis. См. displayQuantity.
  const [quantity, setQuantity] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [portionsOpen, setPortionsOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  // Rename триггерится `<label htmlFor>` в меню → focus-делегация на input
  // (iOS открывает клавиатуру ТОЛЬКО так, см. feedback_ios_focus). DropdownMenu
  // закрывается сам (focus-out при делегации; finalFocus={false} оставляет фокус
  // на инпуте) — здесь только разворачиваем rename-модалку.
  const handleNameFocusCapture = useCallback((e: FocusEvent) => {
    if ((e.target as HTMLElement).id === CHANGE_NAME_INPUT_ID) {
      setRenameOpen(true);
    }
  }, []);

  const nutrientValueMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of nutrientsRaw) map.set(n.nutrientId, n.quantity);
    return map;
  }, [nutrientsRaw]);

  const totalGramMass = useMemo(() => {
    let sum = 0;
    for (const [nutrientId, qty] of nutrientValueMap) {
      if (gramNutrientIds.has(nutrientId)) sum += qty;
    }
    return sum;
  }, [nutrientValueMap]);

  const quantityOptions = useMemo(
    () => buildQuantityOptions(portionsRaw.map((p) => ({ label: p.label, grams: p.grams }))),
    [portionsRaw],
  );

  if (!food) {
    // user-продукт грузится из Dexie (useLiveQuery → undefined первый тик).
    // Показываем имя-«призрак» из productName в родной обвязке DrawerLayout
    // (× в углу + заголовок по центру), пока не подъедет реальная строка.
    const ghostName = productName
      ? productName.charAt(0).toUpperCase() + productName.slice(1)
      : undefined;
    return (
      <DrawerLayout title={ghostName} a11yLabel={productName ?? 'Продукт'}>
        <div className={s.body} />
      </DrawerLayout>
    );
  }

  const isUserCreated = isCreatedByUser(food.id);
  const isSupplement = food.servingBasis === 'serving';
  const defaultQty = isSupplement ? 1 : 100;
  const displayQuantity = quantity ?? defaultQty;
  const scale = scaleForBasis(food.servingBasis, displayQuantity);
  const getNutrientValue = (nutrientId: string) => nutrientValueMap.get(nutrientId) ?? 0;
  const getScaledValue = (nutrientId: string) => getNutrientValue(nutrientId) * scale;

  // Удаление продукта — серая урна в шапке rename-модалки (канон гипотезы).
  // Только свои продукты (рендерится под isUserCreated); каталожные неудаляемы.
  // Confirm → delete → закрываем весь дровер: продукта больше нет.
  const handleDeleteProduct = async () => {
    const confirmed = await modalStore.show(ConfirmModal, {
      title: 'Удалить продукт?',
      message: 'Продукт будет удалён из ваших продуктов. Это действие не отменить.',
      confirmLabel: 'Удалить',
      tone: 'danger',
    });
    if (confirmed !== true) return;
    const res = await safeMutate(() => deleteProducts([productId]), 'Не удалось удалить продукт');
    if (res.ok) {
      setRenameOpen(false);
      onClose();
    }
  };

  const portions = portionsRaw.map((p) => ({ label: p.label, grams: p.grams }));
  const massExceeds100 = totalGramMass > 100;
  const massWarningGrams =
    isUserCreated && food.servingBasis === '100g' && massExceeds100 ? totalGramMass : null;

  // Текущий выбор Select: 'custom' при ручном вводе, иначе пункт с
  // grams === displayQuantity. Фолбэк — первый пункт.
  const selectValue = isCustom
    ? 'custom'
    : (quantityOptions.find((o) => o.grams === displayQuantity)?.value ??
      quantityOptions[0]?.value ??
      '100g');

  const handleQuantityModeChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true);
      return;
    }
    const opt = quantityOptions.find((o) => o.value === value);
    if (opt?.grams != null) {
      setIsCustom(false);
      setQuantity(opt.grams);
    }
  };

  const addPortion = () => {
    const updated = [
      ...portionsRaw,
      { label: nextPortionLabel(portionsRaw), grams: DEFAULT_PORTION_GRAMS },
    ];
    void safeMutate(
      () => setProductPortions(food.id, JSON.stringify(updated)),
      'Не удалось добавить порцию',
    );
    setPortionsOpen(true);
  };

  const updatePortion = (label: string, updates: Partial<PortionItem>) => {
    const updated = portionsRaw.map((p) => (p.label === label ? { ...p, ...updates } : p));
    void safeMutate(
      () => setProductPortions(food.id, JSON.stringify(updated)),
      'Не удалось обновить порцию',
    );
  };

  const deletePortion = (label: string) => {
    const updated = portionsRaw.filter((p) => p.label !== label);
    void safeMutate(
      () => setProductPortions(food.id, JSON.stringify(updated)),
      'Не удалось удалить порцию',
    );
  };

  const openPortionDeleteDrawer = (label: string) => {
    void drawerStore.show(ItemActionsDrawer, {
      title: label || 'Порция',
      onDelete: () => deletePortion(label),
      actions: [],
    });
  };

  const handleNutrientValueChange = (nutrientId: string, value: number) => {
    const current: Record<string, number> = {};
    for (const n of nutrientsRaw) current[n.nutrientId] = n.quantity;
    current[nutrientId] = value;
    if (value === 0) delete current[nutrientId];
    void safeMutate(
      () => setProductNutrients(food.id, JSON.stringify(current)),
      'Не удалось сохранить нутриент',
    );
  };

  // «Предложить нутриенты»: AI estimates the full profile per 100 g from the
  // name → whole-replace. Paid AI request (402 → toast via classifyError).
  //  - `confirm: false` — пустой состав (терять нечего): конструктивное действие
  //    с витрины, без гейта.
  //  - `confirm: true` — состав уже есть: деструктивный overwrite внутри
  //    редактора нутриентов, за confirm-дровером «всё сотрётся».
  const runSuggest = async (confirm: boolean) => {
    if (confirm) {
      const proceed = await drawerStore.show(SuggestNutrientsConfirmDrawer, {});
      if (!proceed) return;
    }
    setSuggesting(true);
    try {
      const record = await suggestProductNutrients(food.name);
      // Empty result (LLM returned all-zero / nothing mapped): do NOT wipe the
      // existing nutrients with `{}`. Keep prior data, tell the user it failed.
      if (Object.keys(record).length === 0) {
        toaster.error('Не удалось подобрать состав, попробуй ещё раз');
        return;
      }
      await setProductNutrients(food.id, JSON.stringify(record));
      toaster.success('Состав обновлён');
    } catch (e) {
      const kind = classifyError(e);
      toaster.error(defaultUserMessage(kind), { kind });
    } finally {
      setSuggesting(false);
    }
  };

  // Имя в шапке: первая буква в верхний регистр (имена приходят строчными,
  // напр. «абрикос»).
  const displayName = food.name.charAt(0).toUpperCase() + food.name.slice(1);

  return (
    <DrawerLayout
      title={displayName}
      subtitle={isUserCreated ? 'мой продукт' : undefined}
      a11yLabel={food.name}
      // Карандаш в правом углу обвязки → drop-down «Название / Нутриенты».
      // Только свои продукты. DropdownMenu (Base UI Menu) сам владеет открытием,
      // позиционированием, click-outside и порталом. `.editIconBtn svg` (0,1,1)
      // перебивает DrawerLayout `.actionHeaderButton *` (бледный глиф / 1.5rem).
      // Rename = пункт-`<label htmlFor>` с `closeOnClick={false}` (focus-делегация
      // для iOS-клавиатуры; меню закроется focus-out'ом), нутриенты — обычный пункт.
      topRight={
        isUserCreated ? (
          <DropdownMenu
            triggerClassName={s.editIconBtn}
            triggerAriaLabel="Редактировать продукт"
            trigger={<EditIcon />}
          >
            <DropdownMenuItem
              closeOnClick={false}
              render={<label htmlFor={CHANGE_NAME_INPUT_ID} />}
            >
              <Text as="span" role="body">Редактировать название</Text>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Text as="span" role="body">Редактировать нутриенты</Text>
            </DropdownMenuItem>
          </DropdownMenu>
        ) : undefined
      }
    >
      <div className={s.body} onFocusCapture={handleNameFocusCapture}>
        {editOpen ? (
          // Инлайн-редактирование состава (вместо отдельной модалки): шапка
          // «Редактирование» + × выхода, AI-подбор, warning-полоса, таблица в
          // режиме инпутов. Селект количества / порции / норму прячем — правится
          // база (на 100 г / 1 единицу), скейл тут не нужен.
          <section className={s.editSection}>
            <div className={s.editHeader}>
              <Heading as="span" role="title" className={s.editTitle}>Редактирование</Heading>
              <button
                type="button"
                className={s.editClose}
                aria-label="Выйти из режима редактирования"
                onClick={() => setEditOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <div className={s.suggestRow}>
              <SuggestActionButton
                label={
                  suggesting
                    ? 'Подбираем…'
                    : nutrientValueMap.size === 0
                      ? 'Предложить состав'
                      : 'Переподобрать состав'
                }
                // Пустой состав — конструктивный подбор без confirm; заполненный —
                // деструктивный whole-replace за confirm-дровером.
                onClick={() => runSuggest(nutrientValueMap.size > 0)}
                disabled={suggesting || !food.name.trim()}
              />
            </div>
            {massWarningGrams != null && (
              <p className={s.massWarning} role="status">
                <Text as="span" role="caption">
                  Совокупная масса нутриентов ({massWarningGrams.toFixed(1)} г) превышает 100 г
                </Text>
              </p>
            )}
            <NutrientTable
              getValue={getNutrientValue}
              variant="edit-values"
              onValueChange={handleNutrientValueChange}
            />
          </section>
        ) : (
          <>
            {/* Порции — только свой продукт-еда (каталог read-only, БАД без порций) */}
            {isUserCreated && !isSupplement && (
              <PortionsAccordion
                open={portionsOpen}
                onToggle={() => setPortionsOpen((o) => !o)}
                onAdd={addPortion}
                portions={portions}
                onUpdate={updatePortion}
                onLongPressRow={openPortionDeleteDrawer}
              />
            )}

            {isUserCreated && nutrientValueMap.size === 0 ? (
              // Пустой состав → живой empty-state вместо мёртвой таблицы. Общий
              // примитив EmptyState (контент: заголовок + слот действий); класс
              // несёт только позиционирование (воздух вокруг). Главное действие
              // нового продукта (заполнить состав) на витрине, не под карандашом:
              // крупная CTA AI-подбора (конструктивно, без confirm) + тихий путь
              // ручного ввода (открывает инлайн-режим правки).
              <EmptyState
                className={s.emptyNutrients}
                title="У продукта пока нет состава"
                action={
                  <>
                    <SuggestActionButton
                      label={suggesting ? 'Подбираем…' : 'Предложить нутриенты'}
                      onClick={() => runSuggest(false)}
                      disabled={suggesting || !food.name.trim()}
                    />
                    <button
                      type="button"
                      className={s.manualLink}
                      onClick={() => setEditOpen(true)}
                    >
                      <Text as="span" role="caption">
                        Ввести вручную
                      </Text>
                    </button>
                  </>
                }
              />
            ) : (
              <>
                {/* Количество + норма — ПРЯМО над таблицей нутриентов. Еда: выбор
                    количества (50% слева) + кнопка нормы (50% справа, текст
                    переносится и прижат влево). БАД: выбора количества нет → норма
                    на всю ширину + подпись «состав на 1 единицу». */}
                {isSupplement ? (
                  <>
                    <div className={s.normRowFull}>
                      <DailyNormButton className={s.normButtonFull} />
                    </div>
                    <Text as="p" role="body" className={s.servingComposition}>Состав на одну единицу:</Text>
                  </>
                ) : (
                  <>
                    <div className={s.measureRow}>
                      <div className={s.quantityControl}>
                        <Select
                          className={s.quantitySelect}
                          ariaLabel="Способ измерения количества"
                          value={selectValue}
                          options={quantityOptions}
                          onChange={handleQuantityModeChange}
                        />
                      </div>
                      <div className={s.normSlot}>
                        <DailyNormButton className={s.normButton} />
                      </div>
                    </div>
                    {isCustom && (
                      <div className={s.quantityInputRow}>
                        <NumberInput
                          value={displayQuantity}
                          min={0}
                          maxLength={4}
                          className={s.quantityInput}
                          onChange={(val) => setQuantity(val)}
                        />
                        <Text as="span" role="body" className={s.quantityUnit}>г</Text>
                      </div>
                    )}
                  </>
                )}

                <NutrientTable getValue={getScaledValue} />
              </>
            )}
          </>
        )}

        {isUserCreated && (
          <ChangeNameModal
            currentName={food.name}
            isExpanded={renameOpen}
            onClose={() => setRenameOpen(false)}
            onChangeName={(name) => {
              void safeMutate(() => updateProduct(food.id, { name }), 'Не удалось переименовать');
              setRenameOpen(false);
            }}
            onDelete={handleDeleteProduct}
            deleteLabel="Удалить продукт"
          />
        )}
      </div>
    </DrawerLayout>
  );
}

export default ProductDrawer;
