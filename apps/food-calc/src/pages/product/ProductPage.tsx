import { type CSSProperties, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import { DailyNormButton } from '@/features/dailyNorms/DailyNormButton';
import {
  FoodPortionsManager,
  PortionCreateModals,
  AddPortionButton,
} from '@/features/food/food-portions-manager';
import { ChangeNameModal, CHANGE_NAME_INPUT_ID } from '@/features/shared/change-name';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import { Screen } from '@/shared/ui/Screen';
import { SuggestActionButton } from '@/shared/ui/SuggestActionButton';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { isCreatedByUser } from '@/shared/lib';
import { safeMutate } from '@/shared/lib/safeMutate';
import s from './ProductPage.module.scss';
import homeStyles from '@/pages/home-page/HomePage.module.scss';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import bagImg from '@/shared/assets/decarative/bag.png';
import moneyImg from '@/shared/assets/decarative/money.png';
import { Select } from '@/shared/ui/atoms/Select';
import { buildQuantityOptions } from '@/features/food/product-drawer/buildQuantityOptions';
import { scaleForBasis } from '@/features/food/product-drawer/scaleForBasis';
import { EditNutrientsModal } from '@/features/food/product-drawer/EditNutrientsModal';

const gramNutrientIds = new Set(allNutrientsList.filter((n) => n.unit === 'g').map((n) => n.id));

// Морф имени card→заголовок временно отключён — сейчас iOS-push-переход
// (FoodActionCard «i» → useViewTransitionNavigate(..., 'push')). Пустой стиль =
// заголовок едет вместе со всей страницей в push'е, без отдельной VT-группы.
// Вернуть морф: поставить { viewTransitionName: 'food-hero-title' } здесь +
// тегать имя-источник в карточке.
const HERO_TITLE_VT_STYLE: CSSProperties = {};

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
  // Имя + origin из навигации (`state.heroName` — цель морфа на первом кадре,
  // пока user-продукт грузится из Dexie; `state.from` — точка, КУДА вернёт back).
  const navState = useLocation().state as { heroName?: string; from?: string } | null;
  const heroName = navState?.heroName;
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
  // «Своё значение» в Select количества → раскрывает числовой ввод граммов.
  const [isCustom, setIsCustom] = useState(false);
  // Fullscreen-редактор нутриентов (только свои продукты).
  const [editOpen, setEditOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const handleNameFocusCapture = useCallback((e: React.FocusEvent) => {
    if ((e.target as HTMLElement).id === CHANGE_NAME_INPUT_ID) {
      setRenameOpen(true);
    }
  }, []);
  // Имя в HomeTopBar.centerLabel возвращается РОВНО когда заголовок контента
  // ушёл под бар — сигнал даёт IntersectionObserver внутри Screen
  // (onContentHeaderVisibilityChange), не магический порог скролла. Видимость
  // держим per-slide в ref (Embla хранит позицию каждого Screen), наружу уходит
  // только булева labelVisible и только на пересечении — свайп/скролл = ноль
  // per-frame ре-рендеров (канон HomePage/DishBuilderPage).
  const activeSlideRef = useRef(0);
  const titleHiddenRef = useRef<boolean[]>([false, false]);
  const [labelVisible, setLabelVisible] = useState(false);
  const recomputeLabel = useCallback(() => {
    const next = titleHiddenRef.current[activeSlideRef.current] ?? false;
    setLabelVisible((prev) => (prev === next ? prev : next));
  }, []);
  const onTitleVisible0 = useCallback(
    (visible: boolean) => {
      titleHiddenRef.current[0] = !visible;
      if (activeSlideRef.current === 0) recomputeLabel();
    },
    [recomputeLabel],
  );
  const onTitleVisible1 = useCallback(
    (visible: boolean) => {
      titleHiddenRef.current[1] = !visible;
      if (activeSlideRef.current === 1) recomputeLabel();
    },
    [recomputeLabel],
  );

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
  // bandImg={false} — паритет с Home/Dish: крупная бледная картинка активного
  // экрана снята (юзер: «от этого уже ушли»). С правоприжатыми 2 плитками она
  // к тому же висела бы под пустой левой колонкой. Мелкие картинки в самих
  // NavTile остаются.
  const nutrientsIndicator = useMemo(
    () =>
      screens.length > 1 ? (
        <ScreenIndicator
          screens={screens}
          onSelect={handleSelect}
          slideIndex={0}
          bandImg={false}
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
          bandImg={false}
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

  // Back ведёт на реальный origin (state.from), фолбэк — последняя посещённая
  // дата расписания. PUSH на явный URL (popstate-back RR намеренно не анимирует).
  const backTo = navState?.from ?? `/schedule/${dateForTopBar}`;

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

  // ── Порции: создание 2-шаговой модалкой + удаление long-press → drawer ──
  // Адаптер прячет хранение: продукт = JSON-массив `products.portions` по label
  // (whole-array replace). Флоу создания живёт внутри PortionCreateModals —
  // общий компонент с DishBuilderPage.
  const portionLabels = useMemo(() => portionsRaw.map((p) => p.label), [portionsRaw]);
  // Пункты Select количества (для продукта-еды): «На 100 г» + «Своё значение» +
  // именованные порции. Мемо на стабильном portionsRaw.
  const quantityOptions = useMemo(
    () => buildQuantityOptions(portionsRaw.map((p) => ({ label: p.label, grams: p.grams }))),
    [portionsRaw],
  );
  const createPortion = (portion: { label: string; grams: number }) => {
    if (!food) return;
    const updated = [...portionsRaw, portion];
    void safeMutate(
      () => setProductPortions(food.id, JSON.stringify(updated)),
      'Не удалось добавить порцию',
    );
  };
  const deletePortion = (label: string) => {
    if (!food) return;
    const updated = portionsRaw.filter((p) => p.label !== label);
    void safeMutate(
      () => setProductPortions(food.id, JSON.stringify(updated)),
      'Не удалось удалить порцию',
    );
  };
  const updatePortion = (
    label: string,
    updates: Partial<{ label: string; grams: number }>,
  ) => {
    if (!food) return;
    const updated = portionsRaw.map((p) => (p.label === label ? { ...p, ...updates } : p));
    void safeMutate(
      () => setProductPortions(food.id, JSON.stringify(updated)),
      'Не удалось обновить порцию',
    );
  };
  const openPortionDeleteDrawer = (label: string) => {
    void drawerStore.show(ItemActionsDrawer, {
      title: label,
      onDelete: () => deletePortion(label),
      actions: [],
    });
  };

  if (!food) {
    // user-продукт ещё грузится из Dexie (useLiveQuery → undefined на первом
    // тике). Рендерим заголовок-«призрак» из имени, переданного навигацией
    // (`state.heroName`), чтобы shared-element морф из карточки SearchFood имел
    // цель уже на ПЕРВОМ кадре нового снапшота. Двойной mount HomeTopBar скрыт
    // под VT-снимком; после перехода показывается реальная страница на том же
    // месте. Прямой заход по URL (без heroName) → обычный null до загрузки.
    if (!heroName) return null;
    return (
      <div className={homeStyles.container}>
        <HomeTopBar
          date={dateForTopBar}
          backSlot={<BackButton to={backTo} />}
          dateButtonLabel={<CalendarIcon width={22} height={22} />}
          centerLabelVisible={false}
          noInterruptGuard
        />
        <div className={homeStyles.swipeArea}>
          <Screen
            headerOverlap
            contentHeader={
              <Heading size="section" as="h2">
                <span style={HERO_TITLE_VT_STYLE}>{heroName}</span>
              </Heading>
            }
          >
            <div style={{ minHeight: '50vh' }} />
          </Screen>
        </div>
      </div>
    );
  }

  const isUserCreated = isCreatedByUser(food.id);

  const getNutrientValue = (nutrientId: string) => nutrientValueMap.get(nutrientId) ?? 0;
  const scale = scaleForBasis(food.servingBasis, displayQuantity);
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

  // Текущий выбор Select количества (продукт-еда): 'custom' при ручном вводе,
  // иначе пункт с grams === displayQuantity (выбор пункта всегда ставит quantity
  // в один из них). Фолбэк — первый пункт. Связывает «выбор количества» с
  // «составом на это количество» через getScaledValue ниже.
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

  const massWarningGrams =
    isUserCreated && food.servingBasis === '100g' && massExceeds100 ? totalGramMass : null;

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
    <div className={homeStyles.container}>
      <HomeTopBar
        date={dateForTopBar}
        backSlot={<BackButton to={backTo} />}
        dateButtonLabel={<CalendarIcon width={22} height={22} />}
        centerLabel={food.name}
        centerLabelHtmlFor={isUserCreated ? CHANGE_NAME_INPUT_ID : undefined}
        centerLabelVisible={labelVisible}
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
      {isUserCreated && (
        <EditNutrientsModal
          isExpanded={editOpen}
          onClose={() => setEditOpen(false)}
          getValue={getNutrientValue}
          onValueChange={handleNutrientValueChange}
          massWarningGrams={massWarningGrams}
        />
      )}
      <div className={homeStyles.swipeArea} {...navTileAnchor}>
        {/* При смене количества слайдов (toggle "еда ↔ БАД" у своих продуктов
            прямо на странице) нужен ремаунт Embla — иначе selectedSnap может
            остаться на несуществующей странице. */}
        <Swipeable
          key={`swipe-${screens.length}`}
          ref={swipeableRef}
          defaultSlide={0}
          hasDots={false}
          onIndexChange={(idx) => {
            activeSlideRef.current = idx;
            recomputeLabel();
          }}
        >
          {/* ── Slide 0: Nutrients ── */}
          <Screen
            key={0}
            headerOverlap
            contentHeader={
              // `<label>` лежит ВНУТРИ heading-а и оборачивает span — валидный
              // HTML, в отличие от `label>h1`. h2 (не h1) — чтобы у страницы
              // остался один h1 даже после дублирования contentHeader в Screen-ах.
              // span несёт `view-transition-name` (HERO_TITLE_VT_STYLE) — цель
              // морфа из карточки SearchFood. ТОЛЬКО slide-0 (slide-1 без имени).
              isUserCreated ? (
                <Heading size="section" as="h2">
                  <label htmlFor={CHANGE_NAME_INPUT_ID} aria-label="Изменить название">
                    <span style={HERO_TITLE_VT_STYLE}>{food.name}</span>
                  </label>
                </Heading>
              ) : (
                <Heading size="section" as="h2">
                  <span style={HERO_TITLE_VT_STYLE}>{food.name}</span>
                </Heading>
              )
            }
            stickyTop={nutrientsIndicator}
            onContentHeaderVisibilityChange={onTitleVisible0}
            // Кнопка «Предложить нутриенты» — только у своих продуктов, слева
            // над hero (общий slot Screen.headerAction + SuggestActionButton,
            // паритет с DishPage). Функционал подключим в следующей сессии —
            // пока onClick намеренно не задан (кнопка-плейсхолдер).
            headerAction={
              isUserCreated ? (
                <SuggestActionButton label="Предложить нутриенты" />
              ) : undefined
            }
          >
            {/* Имя продукта живёт в centerLabel HomeTopBar (sticky сверху).
                Страница — режим просмотра: read-only таблица со скейлом по
                выбранному количеству. Правка состава своих продуктов — в
                fullscreen-модалке (кнопка ниже). Тип (еда/добавка) задаётся при
                создании и здесь НЕ меняется. */}

            {food.servingBasis === 'serving' ? (
              // Добавка: доза — одна единица; количество выбирается при добавлении
              // в расписание, не тут. Состав показываем на 1 шт.
              <p className={s.servingComposition}>Состав на одну единицу:</p>
            ) : (
              <>
                <section className={s.quantityControl}>
                  <Select
                    className={s.quantitySelect}
                    ariaLabel="Способ измерения количества"
                    value={selectValue}
                    options={quantityOptions}
                    onChange={handleQuantityModeChange}
                  />
                </section>

                {isCustom && (
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
                      <span className={s.quantityUnit}>г</span>
                    </span>
                  </section>
                )}
              </>
            )}

            {isUserCreated && (
              <button
                type="button"
                className={s.editNutrientsBtn}
                onClick={() => setEditOpen(true)}
              >
                Редактировать нутриенты
              </button>
            )}

            <div className={s.nutrientsTail}>
              <div className={s.normRow}>
                <DailyNormButton />
              </div>
              <NutrientTable getValue={getScaledValue} />
            </div>
          </Screen>

          {/* ── Slide 1: Portions ── (только для еды; у БАД доза вводится
              числом, кастомные порции не нужны) */}
          {!isSupplementProduct && (
          <Screen
            key={1}
            headerOverlap
            contentHeader={
              isUserCreated ? (
                <Heading size="section" as="h2">
                  <label htmlFor={CHANGE_NAME_INPUT_ID} aria-label="Изменить название">
                    <span>{food.name}</span>
                  </label>
                </Heading>
              ) : (
                <Heading size="section" as="h2">{food.name}</Heading>
              )
            }
            stickyTop={portionsIndicator}
            onContentHeaderVisibilityChange={onTitleVisible1}
            hollow={portionsRaw.length === 0}
            bottomBar={isUserCreated ? <AddPortionButton /> : null}
            overlay={
              isUserCreated ? (
                <PortionCreateModals
                  existingLabels={portionLabels}
                  unit="г"
                  onCreate={createPortion}
                />
              ) : undefined
            }
          >
            <div className={s.portionsScreenInset}>
            {isUserCreated ? (
              <FoodPortionsManager
                portions={portions}
                unit={portionUnit}
                showHint={false}
                onUpdate={updatePortion}
                onLongPressRow={openPortionDeleteDrawer}
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

// Роут `/product/:id` переиспользует ОДИН инстанс при смене параметра — без
// key'а quantity / isCustom / editOpen залипают между продуктами. Особо опасно
// еда→добавка: scale=quantity дал бы таблице добавки ×N. key по id форсит
// ремаунт со свежим state. Фикс /critique 2026-06-06
// (tds/product-page-measurement-redesign.md).
const ProductPageRoute = () => {
  const { id } = useParams<'id'>();
  return <ProductPage key={id} />;
};

export default ProductPageRoute;
