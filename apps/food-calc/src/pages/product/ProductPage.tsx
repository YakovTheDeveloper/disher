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
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientTable } from '@/widgets/nutrients/FoodsNutrients';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { OpenDailyNorms } from '@/features/dailyNorms/OpenDailyNorms';
import { FoodPortionsManager, nextDefaultPortionLabel } from '@/features/food/food-portions-manager';
import { ChangeNameModal, CHANGE_NAME_INPUT_ID } from '@/features/shared/change-name';
import { PlusIcon } from '@/shared/ui/atoms/Button/AddButton/AddButton';
import { Screen } from '@/shared/ui/Screen';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
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

// NavTile ambient — radial-glow per nth-child. Общий anchor-ключ с
// DishBuilderPage: переключение варианта в баре синхронно меняет подсветку
// на обеих страницах. Дефолтная семантика тайла — в base-стилях NavTile.
// Общий ключ с DishBuilderPage; переключение в баре синхронно меняет
// подсветку на обеих страницах. Дефолт `ice-blue` (subtle cool glow,
// согласуется с ProductAmbient.ice-blue фоном).
const NAVTILE_AMBIENT_VARIANTS = [
  'ice-blue',
  'paper-warm',
  'mint-fog',
  'lavender-haze',
  'peach-fog',
  'silver-mist',
  'rose-quartz',
  'none',
] as const;

const PRODUCT_SCREENS_FOOD: ScreenEntry[] = [
  { label: 'Нутриенты', image: bagImg, titleStyle: 'display-sans' },
  { label: 'Порции', image: moneyImg, titleStyle: 'display-sans' },
];
// БАД (servingBasis='serving'): фиксированная доза, кастомные порции не нужны
// — юзер вводит дробное число (0.5, 1, 2). Оставляем только «Нутриенты».
const PRODUCT_SCREENS_SUPPLEMENT: ScreenEntry[] = [PRODUCT_SCREENS_FOOD[0]];

const ProductPage = () => {
  const { id } = useParams<'id'>();
  const food = useProduct(id);
  const portionsRaw = useProductPortions(id);
  const { results: nutrientsRaw } = useProductNutrients(id);
  // Lazy default depends on food, which is undefined on first tick; keep
  // user-entered values as a concrete number, otherwise derive the default
  // from servingBasis (БАД → 1 шт, еда → 100 г). When basis flips in the
  // edit flow, defaultQty re-derives — the input visibly snaps to the new
  // baseline, which is what we want during initial setup.
  const [quantity, setQuantity] = useState<number | null>(null);
  const defaultQty = food?.servingBasis === 'serving' ? 1 : 100;
  const displayQuantity = quantity ?? defaultQty;
  const [renameOpen, setRenameOpen] = useState(false);
  const handleNameFocusCapture = useCallback((e: React.FocusEvent) => {
    if ((e.target as HTMLElement).id === CHANGE_NAME_INPUT_ID) {
      setRenameOpen(true);
    }
  }, []);
  // Per-slide scroll-стейт: Embla сохраняет позицию каждого Screen, поэтому
  // нам нужно знать scrollY активного слайда (не «последнего скроллившего»).
  // При scrollY > 120 активного слайда — возвращаем имя продукта в
  // HomeTopBar.centerLabel. Активный индекс — из Swipeable.onIndexChange ниже.
  const [activeSlide, setActiveSlide] = useState(0);
  const [scrollByIndex, setScrollByIndex] = useState<number[]>([0, 0]);
  const isScrolled = (scrollByIndex[activeSlide] ?? 0) > 120;
  const makeScrollHandler = useCallback(
    (idx: number) => (y: number) => {
      setScrollByIndex((prev) => {
        if (prev[idx] === y) return prev;
        const next = prev.slice();
        next[idx] = y;
        return next;
      });
    },
    [],
  );

  const { anchor: ambientAnchor } = useDesignVariant('ProductAmbient', PRODUCT_AMBIENT_VARIANTS);
  const { anchor: navTileAnchor } = useDesignVariant('NavTileAmbient', NAVTILE_AMBIENT_VARIANTS);
  const swipeableRef = useRef<SwipeableRef>(null);

  const isSupplementProduct = food?.servingBasis === 'serving';
  // Для БАД — единственный screen «Нутриенты», индикатор не нужен. Для еды —
  // обе вкладки + индикатор.
  const screens = isSupplementProduct ? PRODUCT_SCREENS_SUPPLEMENT : PRODUCT_SCREENS_FOOD;

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
    () =>
      screens.length > 1 ? (
        <ScreenIndicator
          screens={screens}
          onSelect={handleSelect}
          slideIndex={0}
        />
      ) : null,
    [handleSelect, screens]
  );
  const portionsIndicator = useMemo(
    () =>
      screens.length > 1 ? (
        <ScreenIndicator
          screens={screens}
          onSelect={handleSelect}
          slideIndex={1}
        />
      ) : null,
    [handleSelect, screens]
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

  const getNutrientValue = (nutrientId: string) => nutrientValueMap.get(nutrientId) ?? 0;
  // basis '100g' → scale = quantity / 100 (food). 'serving' → scale = quantity (supplement).
  const scale = food.servingBasis === 'serving' ? displayQuantity : displayQuantity / 100;
  const getScaledValue = (nutrientId: string) => getNutrientValue(nutrientId) * scale;
  // Screen «Порции» рендерится только для еды (servingBasis !== 'serving' —
  // см. условный рендер ниже), так что unit здесь всегда 'г'. Прежняя ветка
  // про servingUnit стала мёртвой после скрытия вкладки для БАД.
  const portionUnit = 'г';

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

  return (
    <div className={homeStyles.container} {...ambientAnchor}>
      <HomeTopBar
        date={dateForTopBar}
        dateButtonLabel={<CalendarIcon width={22} height={22} />}
        centerLabel={food.name}
        centerLabelHtmlFor={isUserCreated ? CHANGE_NAME_INPUT_ID : undefined}
        centerLabelVisible={isScrolled}
        noInterruptGuard
      />
      <div onFocusCapture={handleNameFocusCapture}>
        <ChangeNameModal
          currentName={food.name}
          isExpanded={renameOpen}
          onClose={() => setRenameOpen(false)}
          onChangeName={(name) => {
            void safeMutate(() => updateProduct(food.id, { name }), 'Не удалось переименовать');
            setRenameOpen(false);
          }}
        />
      </div>
      <div className={homeStyles.swipeArea} {...navTileAnchor}>
        {/* При смене количества слайдов (toggle "еда ↔ БАД" у своих продуктов
            прямо на странице) нужен ремаунт Embla — иначе selectedSnap может
            остаться на несуществующей странице. */}
        <Swipeable
          key={`swipe-${screens.length}`}
          ref={swipeableRef}
          defaultSlide={0}
          hasDots={false}
          onIndexChange={(idx) => setActiveSlide(idx)}
        >
          {/* ── Slide 0: Nutrients ── */}
          <Screen
            key={0}
            headerOverlap
            heroTop={
              // `<label>` лежит ВНУТРИ heading-а и оборачивает span — валидный
              // HTML, в отличие от `label>h1`. h2 (не h1) — чтобы у страницы
              // остался один h1 даже после дублирования heroTop в 2 Screen-ах.
              isUserCreated ? (
                <Heading size="screen" as="h2">
                  <label htmlFor={CHANGE_NAME_INPUT_ID} aria-label="Изменить название">
                    <span>{food.name}</span>
                  </label>
                </Heading>
              ) : (
                <Heading size="screen" as="h2">{food.name}</Heading>
              )
            }
            stickyTop={nutrientsIndicator}
            onScrollY={makeScrollHandler(0)}
          >
            {/* Имя продукта живёт в centerLabel HomeTopBar (sticky сверху).
                Для своих продуктов нутриенты редактируются inline (как
                ингредиенты блюда) — отдельного view/edit-режима нет.
                Системные продукты — read-only со скейлом по quantity. */}

            {!isUserCreated && (
              <section className={s.foodActions}>
                <span className={s.quantityInputRow}>
                  <span className={s.quantityInputBox}>
                    <span aria-hidden className={s.quantityMirror}>
                      {displayQuantity || 0}
                    </span>
                    <NumberInput
                      value={displayQuantity}
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
                <OpenDailyNorms className={s.normIcon} variant="icon" />
              </section>
            )}

            {isUserCreated && (
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

            {isUserCreated && massExceeds100 && (
              <div className={s.massWarning}>
                Совокупная масса нутриентов ({totalGramMass.toFixed(1)} г) превышает 100 г
              </div>
            )}

            <div className={s.nutrientsTail}>
              {isUserCreated ? (
                <NutrientTable
                  getValue={getNutrientValue}
                  variant="edit-values"
                  onValueChange={handleNutrientValueChange}
                />
              ) : (
                <NutrientTable getValue={getScaledValue} />
              )}
            </div>
          </Screen>

          {/* ── Slide 1: Portions ── (только для еды; у БАД доза вводится
              числом, кастомные порции не нужны) */}
          {!isSupplementProduct && (
          <Screen
            key={1}
            headerOverlap
            heroTop={
              isUserCreated ? (
                <Heading size="screen" as="h2">
                  <label htmlFor={CHANGE_NAME_INPUT_ID} aria-label="Изменить название">
                    <span>{food.name}</span>
                  </label>
                </Heading>
              ) : (
                <Heading size="screen" as="h2">{food.name}</Heading>
              )
            }
            stickyTop={portionsIndicator}
            onScrollY={makeScrollHandler(1)}
            hollow={portionsRaw.length === 0}
            bottomBar={
              isUserCreated ? (
                <div className={s.portionsBar}>
                  <button
                    type="button"
                    className={s.addPortionButton}
                    onClick={() => {
                      const updated = [
                        ...portionsRaw,
                        { label: nextDefaultPortionLabel(portions), grams: 0 },
                      ];
                      void safeMutate(
                        () => setProductPortions(food.id, JSON.stringify(updated)),
                        'Не удалось добавить порцию'
                      );
                    }}
                  >
                    <span className={s.addPortionPlus} aria-hidden="true">
                      <PlusIcon />
                    </span>
                    Добавить порцию
                  </button>
                </div>
              ) : null
            }
          >
            <div className={s.portionsScreenInset}>
            {isUserCreated ? (
              <FoodPortionsManager
                portions={portions}
                unit={portionUnit}
                showAddButton={false}
                showHint={false}
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
            </div>
          </Screen>
          )}
        </Swipeable>
      </div>
    </div>
  );
};

export default ProductPage;
