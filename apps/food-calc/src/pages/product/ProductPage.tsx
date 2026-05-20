import { useState, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  useProduct,
  useProductPortions,
  useProductNutrients,
  setProductNutrients,
  setProductPortions,
  updateProduct,
} from '@/entities/product';
import { Nutrients } from '@/entities/nutrient/ui/NutrientGroup';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientCardEditor } from '@/entities/nutrient/ui/NutrientCard';
import NutrientDesignVariants from '@/widgets/nutrients/FoodsNutrients/NutrientDesignVariants';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { OpenDailyNorms } from '@/features/dailyNorms/OpenDailyNorms';
import { FoodPortionsManager } from '@/features/food/food-portions-manager';
import { ChangeNameModal } from '@/features/shared/change-name';
import { Screen } from '@/shared/ui/Screen';
import { ScreenLabel } from '@/shared/ui/atoms/Typography/ScreenLabel';
import { isCreatedByUser } from '@/shared/lib';
import { safeMutate } from '@/shared/lib/safeMutate';
import s from './ProductPage.module.scss';
import homeStyles from '@/pages/home-page/HomePage.module.scss';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import bagImg from '@/shared/assets/decarative/bag.png';
import moneyImg from '@/shared/assets/decarative/money.png';

type Mode = 'view' | 'edit';

type ServingUnitOpt = 'IU' | 'mg' | 'mcg' | 'g' | 'шт';
const SERVING_UNIT_OPTIONS: ServingUnitOpt[] = ['IU', 'mg', 'mcg', 'g', 'шт'];

const gramNutrientIds = new Set(allNutrientsList.filter((n) => n.unit === 'g').map((n) => n.id));

// Ambient backdrop варианты — radial-glow подложки на `homeStyles.container`.
// CSS живёт в HomePage.module.scss (`[data-dv='ProductAmbient']`), общий
// anchor для страниц продукта и блюда.
const PRODUCT_AMBIENT_VARIANTS = [
  'plain',
  'sky-mist',
  'ice-blue',
  'periwinkle',
  'dawn-blue',
] as const;

const PRODUCT_SCREENS: ScreenEntry[] = [
  { label: 'Нутриенты', image: bagImg, titleStyle: 'display-sans' },
  { label: 'Порции', image: moneyImg, titleStyle: 'display-sans' },
];

const ProductPage = () => {
  const { id } = useParams<'id'>();
  const food = useProduct(id);
  const portionsRaw = useProductPortions(id);
  const { results: nutrientsRaw } = useProductNutrients(id);
  const [quantity, setQuantity] = useState(100);
  const [mode, setMode] = useState<Mode>('view');
  const [renameOpen, setRenameOpen] = useState(false);

  const { anchor: ambientAnchor } = useDesignVariant('ProductAmbient', PRODUCT_AMBIENT_VARIANTS);
  const swipeableRef = useRef<SwipeableRef>(null);

  // Свайп НЕ прокидывается в стейт: каждый слайд рендерит свой статичный
  // ScreenIndicator (slideIndex={0/1}). Тот же паттерн, что HomePage —
  // свайп = ноль React-ре-рендеров, Embla двигает DOM сам.
  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
  }, []);

  // Инстансы индикатора держим стабильными (useMemo на стабильном
  // handleSelect) по канону HomePage. Прямого выигрыша от memo(Screen) тут
  // нет — соседние пропы Screen (children/actions/bottomRight) инлайн-JSX,
  // memo пробивается всё равно; вреда тоже нет.
  const nutrientsIndicator = useMemo(
    () => <ScreenIndicator screens={PRODUCT_SCREENS} onSelect={handleSelect} slideIndex={0} />,
    [handleSelect]
  );
  const portionsIndicator = useMemo(
    () => <ScreenIndicator screens={PRODUCT_SCREENS} onSelect={handleSelect} slideIndex={1} />,
    [handleSelect]
  );

  // У продукта нет своей даты — `HomeTopBar` нужен как обвязка + escape-hatch
  // к расписанию. Берём последнюю посещённую дату; `noInterruptGuard`
  // подавляет confirm про разбор той (чужой здесь) даты.
  const dateForTopBar = useMemo(() => {
    if (typeof window === 'undefined') return format(new Date(), 'dd-MM-yyyy');
    return (
      window.localStorage.getItem('lastVisitedScheduleDate') ?? format(new Date(), 'dd-MM-yyyy')
    );
  }, []);

  const nutrientValueMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of nutrientsRaw) {
      map.set(n.nutrientId, n.quantity);
    }
    return map;
  }, [nutrientsRaw]);

  const totalGramMass = useMemo(() => {
    let sum = 0;
    for (const [nutrientId, qty] of nutrientValueMap) {
      if (gramNutrientIds.has(nutrientId)) {
        sum += qty;
      }
    }
    return sum;
  }, [nutrientValueMap]);

  if (!food) return null;

  const isUserCreated = isCreatedByUser(food.id);
  const isEditMode = isUserCreated && mode === 'edit';

  const getNutrientValue = (nutrientId: string) => nutrientValueMap.get(nutrientId) ?? 0;
  // basis '100g' → scale = quantity / 100 (food). 'serving' → scale = quantity (supplement).
  const scale = food.servingBasis === 'serving' ? quantity : quantity / 100;
  const getScaledValue = (nutrientId: string) => getNutrientValue(nutrientId) * scale;
  const portionUnit = food.servingBasis === 'serving' ? (food.servingUnit ?? 'шт') : 'г';

  const massExceeds100 = totalGramMass > 100;

  const portions = portionsRaw.map((p) => ({
    label: p.label,
    grams: p.grams,
  }));

  const handleNutrientValueChange = (nutrientId: string, value: number) => {
    const current: Record<string, number> = {};
    for (const n of nutrientsRaw) current[n.nutrientId] = n.quantity;
    current[nutrientId] = value;
    if (value === 0) delete current[nutrientId];
    void safeMutate(
      () => setProductNutrients(food.id, JSON.stringify(current)),
      'Не удалось сохранить нутриент'
    );
  };

  const renderEditCard = (nutrientData: Nutrient) => {
    return (
      <NutrientCardEditor
        content={nutrientData}
        getValue={getNutrientValue}
        variant="product-edit"
        editValue={getNutrientValue(nutrientData.id)}
        onValueChange={handleNutrientValueChange}
      />
    );
  };

  return (
    <div className={homeStyles.container} {...ambientAnchor}>
      <HomeTopBar
        date={dateForTopBar}
        dateButtonLabel={<CalendarIcon width={22} height={22} />}
        centerLabel={food.name}
        onTitleClick={isUserCreated ? () => setRenameOpen(true) : undefined}
        noInterruptGuard
      />
      <ChangeNameModal
        currentName={food.name}
        isExpanded={renameOpen}
        onClose={() => setRenameOpen(false)}
        onChangeName={(name) => {
          void safeMutate(() => updateProduct(food.id, { name }), 'Не удалось переименовать');
          setRenameOpen(false);
        }}
      />
      <div className={homeStyles.swipeArea}>
        <Swipeable ref={swipeableRef} defaultSlide={0} hasDots={false}>
          {/* ── Slide 0: Nutrients ── */}
          <Screen
            key={0}
            headerOverlap
            stickyTop={nutrientsIndicator}
          >
            {/* Hero-заголовок продукта убран — имя теперь живёт в centerLabel
                HomeTopBar (sticky сверху). Rename UI временно потерян вместе
                с <ChangeName>; вернуть отдельной кнопкой, если понадобится. */}

            <section className={s.foodActions}>
              {!isEditMode && (
                <span className={s.quantityInputRow}>
                  <span className={s.quantityInputBox}>
                    <span aria-hidden className={s.quantityMirror}>
                      {quantity || 0}
                    </span>
                    <NumberInput
                      value={quantity}
                      min={0}
                      maxLength={4}
                      className={s.quantityInput}
                      onChange={(val) => setQuantity(val)}
                    />
                  </span>
                  <span className={s.quantityUnit}>
                    {food.servingBasis === 'serving' ? (food.servingUnit ?? 'шт') : 'г'}
                  </span>
                </span>
              )}
              <OpenDailyNorms className={s.normIcon} variant="icon" />
            </section>

            {isUserCreated && (
              <div className={s.modeToggleRow}>
                <button
                  type="button"
                  className={`${s.modeBtn} ${mode === 'view' ? s.modeBtnActive : ''}`}
                  onClick={() => setMode('view')}
                >
                  Просмотр
                </button>
                <button
                  type="button"
                  className={`${s.modeBtn} ${mode === 'edit' ? s.modeBtnActive : ''}`}
                  onClick={() => setMode('edit')}
                >
                  Редактирование
                </button>
              </div>
            )}

            {isEditMode && (
              <div className={s.servingBlock}>
                <div className={s.modeToggleRow}>
                  <button
                    type="button"
                    className={`${s.modeBtn} ${food.servingBasis === '100g' ? s.modeBtnActive : ''}`}
                    onClick={() =>
                      void safeMutate(
                        () =>
                          updateProduct(food.id, {
                            servingBasis: '100g',
                            servingUnit: null,
                          }),
                        'Не удалось сменить режим продукта'
                      )
                    }
                  >
                    Еда (на 100 г)
                  </button>
                  <button
                    type="button"
                    className={`${s.modeBtn} ${food.servingBasis === 'serving' ? s.modeBtnActive : ''}`}
                    onClick={() =>
                      void safeMutate(
                        () =>
                          updateProduct(food.id, {
                            servingBasis: 'serving',
                            // default unit when switching to supplement; user can change it.
                            servingUnit: food.servingUnit ?? 'шт',
                          }),
                        'Не удалось сменить режим продукта'
                      )
                    }
                  >
                    Добавка (на 1 порцию)
                  </button>
                </div>
                {food.servingBasis === 'serving' && (
                  <div className={s.servingRow}>
                    <ScreenLabel variant="formValueLabel">Единица:</ScreenLabel>
                    <select
                      className={s.servingUnitSelect}
                      value={food.servingUnit ?? 'шт'}
                      onChange={(e) =>
                        void safeMutate(
                          () =>
                            updateProduct(food.id, {
                              servingUnit: e.target.value as ServingUnitOpt,
                            }),
                          'Не удалось сменить единицу'
                        )
                      }
                    >
                      {SERVING_UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {isEditMode && massExceeds100 && (
              <div className={s.massWarning}>
                Совокупная масса нутриентов ({totalGramMass.toFixed(1)} г) превышает 100 г
              </div>
            )}

            <div className={s.nutrientsTail}>
              {isEditMode ? (
                <Nutrients renderCard={renderEditCard} />
              ) : (
                <NutrientDesignVariants getValue={isUserCreated ? getNutrientValue : getScaledValue} />
              )}
            </div>
          </Screen>

          {/* ── Slide 1: Portions ── */}
          <Screen
            key={1}
            headerOverlap
            stickyTop={portionsIndicator}
            hollow={portionsRaw.length === 0}
          >
            {isUserCreated ? (
              <FoodPortionsManager
                portions={portions}
                unit={portionUnit}
                onAdd={(p) => {
                  const updated = [...portionsRaw, p];
                  void safeMutate(
                    () => setProductPortions(food.id, JSON.stringify(updated)),
                    'Не удалось добавить порцию'
                  );
                }}
                onUpdate={(label, updates) => {
                  const updated = portionsRaw.map((p) =>
                    p.label === label ? { ...p, ...updates } : p
                  );
                  void safeMutate(
                    () => setProductPortions(food.id, JSON.stringify(updated)),
                    'Не удалось обновить порцию'
                  );
                }}
                onRemove={(label) => {
                  const updated = portionsRaw.filter((p) => p.label !== label);
                  void safeMutate(
                    () => setProductPortions(food.id, JSON.stringify(updated)),
                    'Не удалось удалить порцию'
                  );
                }}
              />
            ) : (
              <FoodPortionsManager portions={portions} unit={portionUnit} />
            )}
          </Screen>
        </Swipeable>
      </div>
    </div>
  );
};

export default ProductPage;
