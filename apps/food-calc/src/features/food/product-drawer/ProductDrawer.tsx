import { useState, useMemo, useCallback, type FocusEvent } from 'react';
import clsx from 'clsx';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import {
  useProduct,
  useProductPortions,
  useProductNutrients,
  setProductNutrients,
  setProductPortions,
  updateProduct,
} from '@/entities/product';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientTable } from '@/widgets/nutrients/FoodsNutrients';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { Select } from '@/shared/ui/atoms/Select';
import { PlusIcon } from '@/shared/ui/atoms/Button/PlusIcon';
import { DailyNormButton } from '@/features/dailyNorms/DailyNormButton';
import { FoodPortionsManager } from '@/features/food/food-portions-manager';
import { ChangeNameModal, CHANGE_NAME_INPUT_ID } from '@/features/shared/change-name';
// Импорт из конкретного файла, не из barrel: barrel реэкспортит buildInfoActions,
// который импортит ProductDrawer → иначе цикл product-drawer ↔ item-actions-drawer.
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer/ItemActionsDrawer';
import { SuggestActionButton } from '@/shared/ui/SuggestActionButton';
import { drawerStore } from '@/shared/ui/drawer-store';
import { isCreatedByUser } from '@/shared/lib';
import { findCatalogProduct } from '@/shared/data/catalog';
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

// Шеврон аккордеона — inline (в icons/ нет подходящего); currentColor.
const ChevronIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" className={className}>
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// × выхода из режима правки — inline (как ChevronIcon); currentColor.
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

// Аккордеон «Порции» — сверху дровера, закрыт по умолчанию. Шапка = заголовок +
// счётчик (· N) + шеврон; голого „+“ в углу нет. «Добавить» живёт в языке списка:
// пунктирная sky-ghost-пилюля последней строкой раскрытого списка (превью формы
// будущей порции). Тап создаёт порцию с дефолтами и держит аккордеон раскрытым.
// Раскрытие — grid-template-rows 0fr→1fr (composite-friendly; reduced-motion
// глушит длительность в .scss).
const PortionsAccordion = ({
  open,
  onToggle,
  onAdd,
  portions,
  onUpdate,
  onLongPressRow,
}: PortionsAccordionProps) => (
  <section className={s.portions}>
    <button
      type="button"
      className={s.portionsToggle}
      onClick={onToggle}
      aria-expanded={open}
    >
      <span className={s.portionsTitleWrap}>
        <span className={s.portionsTitle}>Порции</span>
        {portions.length > 0 && <span className={s.portionsCount}>· {portions.length}</span>}
      </span>
      <ChevronIcon className={clsx(s.chevron, open && s.chevronOpen)} />
    </button>
    <div className={clsx(s.portionsReveal, open && s.portionsRevealOpen)}>
      <div className={s.portionsRevealInner}>
        {portions.length > 0 && (
          <FoodPortionsManager
            portions={portions}
            unit="г"
            showHint={false}
            onUpdate={onUpdate}
            onLongPressRow={onLongPressRow}
          />
        )}
        <button type="button" className={s.addPortionGhost} onClick={onAdd}>
          <PlusIcon />
          Добавить порцию
        </button>
      </div>
    </div>
  </section>
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
export function ProductDrawer({ productId, productName }: Props) {
  const food = useProduct(productId);
  // Каталожный продукт может нести фото (build-route поле `image`) — резолвим
  // синхронно по id (catalog — const). У своих продуктов / блюд его нет →
  // боковая полоска остаётся с обычной заливкой. Доступно и в ghost-ветке.
  const image = findCatalogProduct(productId)?.image;
  const portionsRaw = useProductPortions(productId);
  const { results: nutrientsRaw } = useProductNutrients(productId);

  // Своё значение граммов («custom»); null = дефолт по basis. См. displayQuantity.
  const [quantity, setQuantity] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [portionsOpen, setPortionsOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Rename триггерится `<label htmlFor>` в меню → focus-делегация на input
  // (iOS открывает клавиатуру ТОЛЬКО так, см. feedback_ios_focus). Меню
  // закрываем здесь, ПОСЛЕ того как фокус уже улетел (focusin firing) — иначе
  // unmount лейбла до делегации сломал бы rename.
  const handleNameFocusCapture = useCallback((e: FocusEvent) => {
    if ((e.target as HTMLElement).id === CHANGE_NAME_INPUT_ID) {
      setRenameOpen(true);
      setMenuOpen(false);
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
      <DrawerLayout title={ghostName} a11yLabel={productName ?? 'Продукт'} image={image}>
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
      image={image}
      // Карандаш в правом углу обвязки → drop-down «Название / Нутриенты».
      // Только свои продукты. Меню живёт в стекинг-контексте обвязки дровера
      // (z поверх контента); `.editWrap`-scoped правила в scss перебивают
      // DrawerLayout `.actionHeaderButton *` (бледный глиф / 1.5rem). Rename —
      // `<label htmlFor>` (focus-делегация для iOS-клавиатуры), нутриенты —
      // обычная кнопка.
      topRight={
        isUserCreated ? (
          <div className={s.editWrap}>
            <button
              type="button"
              className={s.editIconBtn}
              aria-label="Редактировать продукт"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <EditIcon />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className={s.editBackdrop}
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                />
                <div className={s.editMenu} role="menu">
                  {/* НЕ закрываем меню на клике по rename: unmount лейбла до
                      делегации фокуса сломал бы rename. Закрытие — в
                      handleNameFocusCapture (после делегации) / по бэкдропу. */}
                  <label
                    htmlFor={CHANGE_NAME_INPUT_ID}
                    className={s.editMenuItem}
                    role="menuitem"
                  >
                    Редактировать название
                  </label>
                  <button
                    type="button"
                    className={s.editMenuItem}
                    role="menuitem"
                    onClick={() => {
                      setEditOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    Редактировать нутриенты
                  </button>
                </div>
              </>
            )}
          </div>
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
              <span className={s.editTitle}>Редактирование</span>
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
                Совокупная масса нутриентов ({massWarningGrams.toFixed(1)} г) превышает 100 г
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
              // Пустой состав → живой empty-state вместо мёртвой таблицы. Главное
              // действие нового продукта (заполнить состав) на витрине, не под
              // карандашом: крупная CTA AI-подбора (конструктивно, без confirm) +
              // тихий путь ручного ввода (открывает инлайн-режим правки).
              <div className={s.emptyNutrients}>
                <p className={s.emptyNutrientsCaption}>У продукта пока нет состава</p>
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
                  Ввести вручную
                </button>
              </div>
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
                    <p className={s.servingComposition}>Состав на одну единицу:</p>
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
                        <span className={s.quantityUnit}>г</span>
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
          />
        )}
      </div>
    </DrawerLayout>
  );
}

export default ProductDrawer;
