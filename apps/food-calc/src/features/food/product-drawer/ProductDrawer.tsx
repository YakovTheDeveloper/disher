import { useState, useMemo, useCallback, type FocusEvent } from 'react';
import clsx from 'clsx';
import { Drawer } from '@base-ui/react/drawer';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
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
import { safeMutate } from '@/shared/lib/safeMutate';
import type { BaseDrawerProps } from '@/shared/ui';
import EditIcon from '@/shared/assets/icons/edit.svg?react';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import { buildQuantityOptions } from './buildQuantityOptions';
import { scaleForBasis } from './scaleForBasis';
import { EditNutrientsModal } from './EditNutrientsModal';
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

type PortionsAccordionProps = {
  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
  portions: PortionItem[];
  onUpdate: (label: string, updates: Partial<PortionItem>) => void;
  onLongPressRow: (label: string) => void;
};

// Аккордеон «Порции» — сверху дровера, закрыт по умолчанию. «+» создаёт порцию с
// дефолтами и раскрывает аккордеон. Раскрытие — grid-template-rows 0fr→1fr
// (composite-friendly; reduced-motion глушит длительность в .scss). При 0 порций
// рисуем подсказку — аккордеон всё равно visibly раскрывается.
const PortionsAccordion = ({
  open,
  onToggle,
  onAdd,
  portions,
  onUpdate,
  onLongPressRow,
}: PortionsAccordionProps) => (
  <section className={s.portions}>
    <div className={s.portionsHeader}>
      <button
        type="button"
        className={s.portionsToggle}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className={s.portionsTitle}>Порции</span>
        <ChevronIcon className={clsx(s.chevron, open && s.chevronOpen)} />
      </button>
      <button
        type="button"
        className={s.portionsAdd}
        onClick={onAdd}
        aria-label="Добавить порцию"
      >
        <PlusIcon />
      </button>
    </div>
    <div className={clsx(s.portionsReveal, open && s.portionsRevealOpen)}>
      <div className={s.portionsRevealInner}>
        {portions.length === 0 ? (
          <p className={s.portionsEmpty}>
            Пока нет порций. По «+» добавим «{DEFAULT_PORTION_BASE}, {DEFAULT_PORTION_GRAMS} г» —
            переименуешь и поправишь вес.
          </p>
        ) : (
          <FoodPortionsManager
            portions={portions}
            unit="г"
            showHint={false}
            onUpdate={onUpdate}
            onLongPressRow={onLongPressRow}
          />
        )}
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
  const portionsRaw = useProductPortions(productId);
  const { results: nutrientsRaw } = useProductNutrients(productId);

  // Своё значение граммов («custom»); null = дефолт по basis. См. displayQuantity.
  const [quantity, setQuantity] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [portionsOpen, setPortionsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNameFocusCapture = useCallback((e: FocusEvent) => {
    if ((e.target as HTMLElement).id === CHANGE_NAME_INPUT_ID) setRenameOpen(true);
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
    // Показываем имя-«призрак» из productName, пока не подъедет реальная строка.
    return (
      <DrawerLayout a11yLabel={productName ?? 'Продукт'} hideTopChrome>
        <div className={s.body}>
          <div className={s.topBar}>
            <Drawer.Close
              className={s.closeBtn}
              aria-label="Закрыть"
              onClick={(e) => e.stopPropagation()}
            >
              <CrossIcon />
            </Drawer.Close>
          </div>
          {productName && (
            <div className={s.header}>
              <Heading size="drawer" as="h2" className={s.title}>
                {productName}
              </Heading>
            </div>
          )}
        </div>
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

  return (
    <DrawerLayout a11yLabel={food.name} hideTopChrome>
      <div className={s.body} onFocusCapture={handleNameFocusCapture}>
        <div className={s.topBar}>
          {/* × закрытия — СЛЕВА (канон проекта: Drawer.Close всегда topLeft). */}
          <Drawer.Close
            className={s.closeBtn}
            aria-label="Закрыть"
            onClick={(e) => e.stopPropagation()}
          >
            <CrossIcon />
          </Drawer.Close>
          {/* Карандаш справа → мини-popover «Редактировать название / нутриенты».
              Только свои продукты. Кастомный inline-popover (не PopoverTrigger):
              его content z-index 1000 < дровер 5001 → меню ушло бы ПОД дровер.
              Inline-меню живёт в стекинг-контексте дровера, поверх контента. */}
          {isUserCreated && (
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
                    {/* rename — `<label htmlFor>` (iOS открывает клавиатуру только
                        по focus-делегации). НЕ закрываем меню на этом клике: иначе
                        unmount лейбла до делегации фокуса ломает rename. Меню
                        перекроется модалкой переименования / закроется бэкдропом. */}
                    <label htmlFor={CHANGE_NAME_INPUT_ID} className={s.editMenuItem} role="menuitem">
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
          )}
        </div>

        <div className={s.header}>
          <Heading size="drawer" as="h2" className={s.title}>
            {food.name}
          </Heading>
          {isUserCreated && <span className={s.ownership}>мой продукт</span>}
        </div>

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

        {isUserCreated && (
          <div className={s.suggestRow}>
            <SuggestActionButton label="Предложить нутриенты" />
          </div>
        )}

        <div className={s.normRow}>
          <DailyNormButton />
        </div>

        {/* Количество + скейл — ПРЯМО над таблицей нутриентов (юзер). БАД —
            состав на 1 единицу, без выбора количества. */}
        {isSupplement ? (
          <p className={s.servingComposition}>Состав на одну единицу:</p>
        ) : (
          <>
            <div className={s.quantityControl}>
              <Select
                className={s.quantitySelect}
                ariaLabel="Способ измерения количества"
                value={selectValue}
                options={quantityOptions}
                onChange={handleQuantityModeChange}
              />
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
        {isUserCreated && (
          <EditNutrientsModal
            isExpanded={editOpen}
            onClose={() => setEditOpen(false)}
            getValue={getNutrientValue}
            onValueChange={handleNutrientValueChange}
            massWarningGrams={massWarningGrams}
          />
        )}
      </div>
    </DrawerLayout>
  );
}

export default ProductDrawer;
