import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
import { Ornament } from '@/shared/ui/Ornament';
import { PageHeading } from '@/shared/ui/PageHeading';
import { Spacer } from '@/shared/ui/atoms/Spacer';
import { OpenDailyNorms } from '@/features/dailyNorms/OpenDailyNorms';
import { FoodPortionsManager } from '@/features/food/food-portions-manager';
import { ChangeName } from '@/features/shared/change-name';
import { useFilterNutrients, FilterNutrientsPanel } from '@/features/nutrients/filter-nutrients';
import { Button, FilterButton } from '@/shared/ui/atoms/Button';
import { Screen } from '@/shared/ui/Screen';
import { ScreenLabel } from '@/shared/ui/atoms/Typography/ScreenLabel';
import { isCreatedByUser } from '@/shared/lib';
import { safeMutate } from '@/shared/lib/safeMutate';
import bagImage from '@/shared/assets/decarative/bag.png';
import s from './ProductPage.module.scss';
import { TopBar } from '@/shared/ui/TopBar';
import { drawerStore } from '@/shared';
import { ScheduleSelectionDrawer } from '@/features/ScheduleSelection/ScheduleSelectionDrawer';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { Swipeable } from '@/shared/ui/Swipeable';

type Mode = 'view' | 'edit';

type ServingUnitOpt = 'IU' | 'mg' | 'mcg' | 'g' | 'шт';
const SERVING_UNIT_OPTIONS: ServingUnitOpt[] = ['IU', 'mg', 'mcg', 'g', 'шт'];

const gramNutrientIds = new Set(allNutrientsList.filter((n) => n.unit === 'g').map((n) => n.id));

const ProductPage = () => {
  const { id } = useParams<'id'>();
  const food = useProduct(id);
  const portionsRaw = useProductPortions(id);
  const { results: nutrientsRaw } = useProductNutrients(id);
  const [quantity, setQuantity] = useState(100);
  const [mode, setMode] = useState<Mode>('view');
  const filter = useFilterNutrients();
  const { toScheduleBuilder } = useAppRoutes();

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

  console.warn('[debug ProductPage] id=', id, 'food=', food);
  if (!food) return null;

  const isUserCreated = isCreatedByUser(food.id);
  const isEditMode = isUserCreated && mode === 'edit';

  const getNutrientValue = (nutrientId: string) => nutrientValueMap.get(nutrientId) ?? 0;
  // basis '100g' → scale = quantity / 100 (food). 'serving' → scale = quantity (supplement).
  const scale = food.servingBasis === 'serving' ? quantity : quantity / 100;
  const getScaledValue = (nutrientId: string) => getNutrientValue(nutrientId) * scale;

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

  const handleCalendarClick = useCallback(async () => {
    const selectedDate = await drawerStore.show(ScheduleSelectionDrawer, {});
    if (selectedDate) {
      toScheduleBuilder(selectedDate);
    }
  }, [toScheduleBuilder]);

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
    <Swipeable hasDots defaultSlide={0}>
      {/* ── Slide 1: Nutrients ── */}
      <Screen
        topPanel={
          <TopBar>
            <Button variant="menu" onClick={handleCalendarClick}>
              Календарь
            </Button>
          </TopBar>
        }
        title={<ScreenLabel variant="screenHeader">Продукт</ScreenLabel>}
        bottomRight={
          !isEditMode ? (
            <FilterButton onClick={filter.toggleFilterMode} isActive={filter.filterMode} />
          ) : undefined
        }
        actions={
          filter.filterMode ? (
            <FilterNutrientsPanel
              showProgress={filter.showProgress}
              showValues={filter.showValues}
              onToggleProgress={filter.toggleShowProgress}
              onToggleValues={filter.toggleShowValues}
              onToggleFilterMode={filter.toggleFilterMode}
            />
          ) : (
            <div></div>
          )
        }
      >
        <img src={bagImage} className={s.backgroundImage} alt="" />
        <ChangeName
          name={food.name}
          canRename={isUserCreated}
          onChangeName={(name) =>
            void safeMutate(() => updateProduct(food.id, { name }), 'Не удалось переименовать')
          }
          heading={
            <PageHeading
              align="left"
              title={<span className={s.heroTitle}>{food.name}</span>}
              subtitle={isUserCreated ? 'мой продукт' : 'базовый продукт'}
            />
          }
        />

        <Spacer variant="screen-header-offset" />

        <section className={s.foodActions}>
          {!isEditMode && (
            <div className={s.quantityInputWrapper}>
              <div className={s.quantityInputRow}>
                <NumberInput
                  value={quantity}
                  min={0}
                  className={s.quantityInput}
                  onChange={(val) => setQuantity(val)}
                />
                <span className={s.quantityUnit}>
                  {food.servingBasis === 'serving' ? (food.servingUnit ?? 'шт') : 'г'}
                </span>
              </div>
            </div>
          )}
          <div className={s.foodActionRow}>
            <OpenDailyNorms />
          </div>
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

        {isEditMode ? (
          <Nutrients renderCard={renderEditCard} />
        ) : (
          <NutrientDesignVariants getValue={isUserCreated ? getNutrientValue : getScaledValue} />
        )}
      </Screen>

      {/* ── Slide 2: Portions ── */}
      <div className={s.slide}>
        <Ornament text="порции" />

        {isUserCreated ? (
          <FoodPortionsManager
            portions={portions}
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
          <FoodPortionsManager portions={portions} />
        )}
      </div>
    </Swipeable>
  );
};

export default ProductPage;
