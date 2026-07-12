import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFood.module.scss';
import { FoodActionCard } from './food-action-card';
import ArrowUpIcon from '@/shared/assets/icons/arrowLeft.svg?react';
import { SearchFoodControls } from '@/features/food/food-search/SearchFoodControls';
import {
  allNutrientsList,
  defaultDailyNorms,
  nutrientsHaveDailyNorm,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useUserNormItems } from '@/entities/daily-norm';
import { drawerStore } from '@/shared/ui/drawer-store';
import { NutrientPickerDrawer } from './NutrientPickerDrawer';
import { useScrollBottomIndicator } from '@/hooks/useScrollBottomIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';
import { RoundButton } from '@/shared/ui/RoundButton';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import {
  useHeaderCollapse,
  useScrollEdgesContext,
} from '@/shared/ui/hooks/scrollEdgesContext';
import { useFilteredFoods, useFoodCreation, useRichNutrientStore } from './model';
import { FoodSearchEmpty } from './FoodSearchEmpty';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { mergeRefs } from '@/shared/lib/mergeRefs';
import { useDebouncedValue } from '@/shared/lib/hooks/useDebouncedValue';

// Гравюра-заглушка в центре медали «Новая еда» — flip'ается 🎨-баром вживую,
// чтобы выбрать картинку глазами. Дефолт (первый) = plate-question.
const MEDAL_IMG_BY_VARIANT = {
  'plate-question': '/art/plate-question.png',
  dish: '/art/dish.png',
} as const;
const MEDAL_VARIANTS = ['plate-question', 'dish'] as const;

export type SearchMode = 'products-only' | 'dishes-only' | 'products-and-dishes';
export type SearchFilter = 'all' | 'mine';

const FILTER_OPTIONS_BY_MODE: Record<SearchMode, readonly SearchFilter[] | null> = {
  'dishes-only': null,
  'products-only': ['all', 'mine'],
  'products-and-dishes': ['all', 'mine'],
};

type SelectFoodPayload = { variant: 'product' | 'dish'; id: string; name: string };

type Props = {
  onSelectFood: (payload: SelectFoodPayload) => void;
  mode: SearchMode;
  activeItemId?: string | null;
  onInfoClick?: (variant: 'product' | 'dish', id: string) => void;
  // NB: хедер (back + тайтл) больше НЕ живёт внутри SearchFood — он вынесен
  // прямым ребёнком <ModalShell> в консумере (симметрия с create/quantity),
  // тайтл считает useSearchHeaderContent. Отсюда ушли пропы title/titleMeta/onBack.
  bottomLeft?: React.ReactNode;
  itemHtmlFor?: string;
  inputId?: string;
  initialSearchQuery?: string;
  isActive?: boolean;
  /**
   * When provided, the empty-state "create product/dish" actions become
   * <label htmlFor={createInputHtmlFor}> instead of standalone buttons, and
   * onPickCreate is invoked on click with the current search query as the
   * proposed name. The host can stash {variant, name} into its draft and let
   * onFocusCapture flip the step to the create modal.
   */
  createInputHtmlFor?: string;
  onPickCreate?: (variant: 'product' | 'dish', name: string) => void;
  /** Контекст блюда: прячет БАД (basis='serving') из результатов поиска —
   *  serving-продукт нельзя класть в блюдо (dish-калькулятор считает в граммах). */
  excludeSupplements?: boolean;
};

// Outer component: ALWAYS renders the <input id={inputId}> via SearchFoodControls so
// the <label htmlFor> → input focus delegation keeps working on iOS, even when this
// step is not the active one. Heavy work (Fuse indexes over the catalog, list rendering)
// lives in <SearchFoodHeavy> which is mounted one frame after isActive flips to true —
// letting the modal frame paint first instead of blocking on ~400 cards.
const SearchFood = ({
  onSelectFood,
  mode = 'products-and-dishes',
  activeItemId,
  onInfoClick,
  bottomLeft,
  itemHtmlFor,
  inputId,
  initialSearchQuery,
  isActive = true,
  createInputHtmlFor,
  onPickCreate,
  excludeSupplements = false,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
  const [showHeavy, setShowHeavy] = useState(false);
  const [openTicket, setOpenTicket] = useState(0);

  // Скролл-рут живёт в outer (не в Heavy), чтобы шапка `.header` лежала В ПОТОКЕ
  // ПЕРВЫМ ребёнком и уезжала вверх ВМЕСТЕ со списком (запрос 2026-06-27 — раньше
  // шапка парила `position:absolute` поверх, список скроллился под ней). Поле
  // поиска (input) обязано рендериться в outer всегда (label-focus делегация на
  // iOS, см. шапку файла) → и контейнер скролла, который его оборачивает, тоже.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  // Гард «программный скролл» (scroll-to-top по новому поиску / по кнопке) — чтобы
  // не глушить клавиатуру и не считать его за пользовательский скролл. Шарится с
  // Heavy (эффект scroll-to-top по смене запроса живёт там, где считается totalItems).
  const isProgrammaticScrollRef = useRef(false);
  // Сентинель низа списка (рендерит Heavy) + флаг «есть ещё ниже» считаем в outer —
  // ScrollIndicator и FAB якорятся к viewport-размерному `.content`, а не к высокому
  // скролл-контенту, поэтому и состояние скролла держим здесь.
  const { sentinelRef, hasMoreBelow } = useScrollBottomIndicator(scrollerRef);

  // FAB «наверх» — появляется, когда список прокручен на ~экран вниз. Возврат скроллит
  // контейнер к началу. Шапка вынесена ИЗ скроллера (фиксированная обвязка сверху) →
  // её высота больше не часть скролл-контента; порог = небольшая константа.
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Собственный скролл-рут SearchFood заменяет ModalShell.Body, поэтому механизм
  // сворачивания заголовка (--header-collapse) не питается сам — прокидываем скролл
  // в тот же collapse-контекст руками, иначе ModalShell.Header-сосед не ужимается.
  const { onScroll: onCollapseScroll } = useHeaderCollapse();
  // По той же причине не питается и верхний divider-шов ModalShell.Header: его
  // `data-scrolled` идёт от useScrollEdges ModalShell, чей сентинел живёт в
  // ModalShell.Body (тут не рендерится). Монтируем ЕГО верхний сентинел прямым
  // ребёнком нашего `.scroller` — observer возьмёт скроллер за root, и шов оживёт.
  // Null вне ModalShell (standalone) → ref undefined, сентинел безвреден.
  const scrollEdges = useScrollEdgesContext();
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = scrollerRef.current;
      if (!el) return;
      onCollapseScroll?.(e);
      // Глушим клавиатуру на пользовательском скролле (mobile UX); программный — мимо.
      if (!isProgrammaticScrollRef.current) {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
          active.blur();
        }
      }
      setShowScrollTop(el.scrollTop > 72);
    },
    [onCollapseScroll]
  );
  const handleScrollTop = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    isProgrammaticScrollRef.current = true;
    el.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, []);

  const filterOptions = FILTER_OPTIONS_BY_MODE[mode];
  const [selectedFilter, setSelectedFilter] = useState<SearchFilter>('all');

  // Выбранный нутриент для фильтра «Еда богатая нутриентом» — в сторе (не useState),
  // чтобы переживать remount SearchFood (консумеры рендерят `key={sessionKey}` и
  // бампают key после каждого добавления). Держится, пока юзер сам не снимет
  // крестиком. Не персистим. Стор же делает orphan-drawer гонку безобидной: выбор
  // из «осиротевшего» пикера просто пишется в стор, который читает текущий инстанс.
  const richNutrient = useRichNutrientStore((s) => s.richNutrient);
  const setRichNutrient = useRichNutrientStore((s) => s.setRichNutrient);
  const clearRichNutrient = useRichNutrientStore((s) => s.clearRichNutrient);

  const richNutrientName = useMemo(
    () =>
      richNutrient
        ? (allNutrientsList.find((n) => n.id === richNutrient.id)?.displayNameRu ?? null)
        : null,
    [richNutrient]
  );

  const handleOpenNutrientPicker = useCallback(async () => {
    const picked = await drawerStore.show(
      NutrientPickerDrawer,
      { activeId: richNutrient?.id },
      { side: 'left', width: 'min(85vw, 360px)' }
    );
    if (picked) setRichNutrient(picked);
  }, [setRichNutrient, richNutrient?.id]);

  useEffect(() => {
    if (!isActive) {
      setShowHeavy(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      setOpenTicket((t) => t + 1);
      setShowHeavy(true);
    });
    return () => cancelAnimationFrame(id);
  }, [isActive]);

  const handleSelectFood = useCallback(
    (payload: SelectFoodPayload) => {
      onSelectFood(payload);
      // (б): после выбора элемента селект моргает обратно в «Еда». В большинстве
      // флоу SearchFood в этот момент уже размонтируется (step переключается) и
      // ресет невидим, но это защита для сценариев где он остаётся открытым.
      if (filterOptions) setSelectedFilter('all');
    },
    [onSelectFood, filterOptions]
  );

  // Плавающая монета «Новая еда» — только в create-флоу (когда хост дал
  // onPickCreate + createInputHtmlFor). Заменила нижний док/инлайн-плитки
  // FoodSearchEmpty; выбор блюдо/продукт переехал в саму модалку создания
  // (сегмент). Прячем при активном richNutrient (паритет с инлайн-createButtons,
  // которые тоже глушились под фильтром богатства). При выборе нутриента поиск =
  // режим фильтра, создавать еду в нём нет смысла.
  const showCreateDock = Boolean(onPickCreate && createInputHtmlFor) && !richNutrient;
  // Монета «Новая еда» липнет над клавиатурой. mode:'transform' (НЕ 'fixed'):
  // это ПРАВЫЙ FAB (position:absolute; right:12px), а не full-width бар. Режим
  // 'fixed' ставил left:0;right:0 → контейнер растягивался на всю ширину и flex
  // без justify кидал монету к ЛЕВОМУ краю («уходит влево»). 'transform' только
  // поднимает translateY на высоту клавы, сохраняя absolute-якорь right:12px:
  // `.content` full-height, его низ = низ экрана (layout viewport клавой не жмётся),
  // подъём на высоту клавы сажает монету ровно над ней.
  const createFabRef = useKeyboardStick<HTMLDivElement>({
    mode: 'transform',
    enabled: showCreateDock,
  });

  // Design-variant картинки медали «Новая еда» (см. MEDAL_* сверху). Anchor.ref
  // (callback) мёржим с createFabRef (RefObject) на одном узле createFab —
  // IntersectionObserver бара видит медаль, keyboard-stick продолжает её липить.
  const { variant: medalVariant, anchor: medalAnchor } = useDesignVariant(
    'SearchFoodMedal',
    MEDAL_VARIANTS
  );
  const { ref: medalRef, ...medalDataAttrs } = medalAnchor;
  const medalImg = MEDAL_IMG_BY_VARIANT[medalVariant];
  // createFab несёт два потребителя узла: keyboard-stick (RefObject) + IO-anchor
  // design-варианта (callback). Сливаем через mergeRefs — оба видят элемент.
  const setCreateFabRef = useMemo(() => mergeRefs(createFabRef, medalRef), [createFabRef, medalRef]);

  return (
    <div className={styles.content}>
      <div
        className={clsx(styles.scroller, showCreateDock && styles.scrollerWithDock)}
        ref={scrollerRef}
        onScroll={handleScroll}
      >
        {/* Верхний сентинел ModalShell (шов ModalHeader) — ПЕРВЫЙ ребёнок скроллера,
            чтобы observer взял `.scroller` за root. Ушёл из вида при скролле → scrolled
            → data-scrolled на ModalHeader → нижний divider-шов. 1px + отриц. margin =
            нулевой вклад в поток. */}
        <div
          ref={scrollEdges?.topSentinelRef}
          className={styles.topSentinel}
          aria-hidden="true"
        />
        {/* Шапка поиска = первый ВИДИМЫЙ ребёнок скролл-рута (после zero-space
            сентинела; просьба 2026-07-12: не липнет, уезжает вверх ВМЕСТЕ со списком).
            В обычном потоке (НЕ position:sticky) →
            прокручивается с контентом. Рендерится ВСЕГДА (вне showHeavy-гейта), чтобы
            <input> оставался always-mounted — иначе ломается iOS label-focus caret-фикс
            (см. шапку файла). Full-bleed `.bar::after` теперь inset (его -12px вылет
            всё равно срезал бы горизонтальный overflow скролл-рута). */}
        <div className={styles.header} ref={headerRef}>
          <SearchFoodControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            inputId={inputId}
            filterOptions={filterOptions ?? undefined}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            showNutrientFilter={mode !== 'dishes-only'}
            selectedNutrientLabel={richNutrientName}
            onOpenNutrientPicker={handleOpenNutrientPicker}
            onClearNutrient={clearRichNutrient}
          />
        </div>
        {showHeavy && (
          <div key={openTicket} className={styles.heavyFade}>
            <SearchFoodHeavy
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              mode={mode}
              selectedFilter={selectedFilter}
              activeItemId={activeItemId}
              richNutrient={richNutrient}
              onInfoClick={onInfoClick}
              onSelectFood={handleSelectFood}
              bottomLeft={bottomLeft}
              itemHtmlFor={itemHtmlFor}
              createInputHtmlFor={createInputHtmlFor}
              onPickCreate={onPickCreate}
              excludeSupplements={excludeSupplements}
              scrollerRef={scrollerRef}
              isProgrammaticScrollRef={isProgrammaticScrollRef}
              sentinelRef={sentinelRef}
            />
          </div>
        )}
      </div>

      {/* Индикатор «есть ещё ниже» + FAB «наверх» якорятся к viewport-размерному
          `.content`, поверх скролл-рута и нижнего дока. */}
      {showHeavy && <ScrollIndicator visible={hasMoreBelow} variant="light" bleed />}
      {showHeavy && showScrollTop && (
        <button
          type="button"
          className={styles.scrollTopFab}
          onClick={handleScrollTop}
          aria-label="Наверх, к началу списка"
        >
          <ArrowUpIcon />
        </button>
      )}

      {/* Плавающая круглая монета «Новая еда» внизу-справа — тот же RoundButton,
          что Food-бар на HomePage: дуга «Новая еда» сверху + гравюра-клош в центре
          (не плюс — тот читался убого) + paper-облик. Сама по себе `<label
          htmlFor={CREATE_INPUT}>` — делегирует фокус инпуту имени в модалке
          создания → onFocusCapture хоста флипнет шаг на 'create' (канон Label
          focus delegation — setStep НЕ зовём, только stash варианта+имени через
          onPickCreate в onClick). Дефолт-вариант product; в модалке переключается
          сегментом. Имя = текущий запрос (префилл). Липнет над клавиатурой
          (useKeyboardStick). */}
      {showCreateDock && createInputHtmlFor && (
        <div ref={setCreateFabRef} className={styles.createFab} {...medalDataAttrs}>
          <RoundButton
            htmlFor={createInputHtmlFor}
            ariaLabel="Создать новую еду"
            arcTop="Новая еда"
            img={medalImg}
            floating={false}
            look="elevated"
            onClick={() => onPickCreate?.('product', searchQuery.trim())}
          />
        </div>
      )}
    </div>
  );
};

type HeavyProps = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  mode: SearchMode;
  selectedFilter: SearchFilter;
  activeItemId?: string | null;
  richNutrient?: { id: string; unit: string } | null;
  onInfoClick?: (variant: 'product' | 'dish', id: string) => void;
  onSelectFood: (payload: SelectFoodPayload) => void;
  bottomLeft?: React.ReactNode;
  itemHtmlFor?: string;
  createInputHtmlFor?: string;
  onPickCreate?: (variant: 'product' | 'dish', name: string) => void;
  excludeSupplements?: boolean;
  /** Скролл-рут живёт в outer (оборачивает шапку+список) — Heavy получает его ref,
   *  чтобы скроллить к началу при новом поиске. */
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  /** Гард «программный скролл» (шарится с outer onScroll). */
  isProgrammaticScrollRef: React.MutableRefObject<boolean>;
  /** Сентинель низа списка — рендерим в конце контента, наблюдает его outer. */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
};

const SearchFoodHeavy = ({
  searchQuery,
  setSearchQuery,
  mode,
  selectedFilter,
  activeItemId,
  richNutrient,
  onInfoClick,
  onSelectFood,
  bottomLeft,
  itemHtmlFor,
  createInputHtmlFor,
  onPickCreate,
  excludeSupplements = false,
  scrollerRef,
  isProgrammaticScrollRef,
  sentinelRef,
}: HeavyProps) => {
  const userOnlyProducts = selectedFilter === 'mine';

  // Дебаунс поиска: дорогой Fuse-фильтр по каталогу + рендер ~700 карточек не
  // должен гонять на КАЖДОЕ нажатие. Поле печатает по немедленному `searchQuery`
  // (живёт в outer, без лага), а фильтр читает ДЕБАУНС-значение — на быстром вводе
  // нескольких символов тяжёлая работа считается ОДИН раз, после паузы 200мс.
  // useDeferredValue тут не подошёл: он ре-рендерит список ДВАЖДЫ на нажатие
  // (stale+fresh), и на ~700 карточках быстрый ввод начинал лагать. С дебаунсом
  // products/dishes стабильны между нажатиями → React Compiler переиспользует
  // отрисованные ряды. NB: имя для создания еды (`trimmedQuery` ниже) остаётся на
  // немедленном `searchQuery` — префилл должен совпадать с напечатанным сейчас.
  const debouncedQuery = useDebouncedValue(searchQuery, 200);
  const { products, dishes, nutrientMap } = useFilteredFoods(
    debouncedQuery,
    richNutrient?.id,
    userOnlyProducts,
    excludeSupplements
  );
  const { handleCreateProduct, handleCreateDish } = useFoodCreation(searchQuery, setSearchQuery);

  // mode задаёт глобальный скоуп, selectedFilter сужает дальше:
  //   'all'  → не сужает; catalog + user-products + (dishes если mode)
  //   'mine' → только user-products + (dishes если mode); catalog скрыт
  //            (catalog-фильтрация делается в useFilteredFoods через userOnlyProducts)
  const showProductsByMode = mode !== 'dishes-only';
  const showDishesByMode = mode !== 'products-only';
  const showProducts = showProductsByMode;
  const showDishes = showDishesByMode;
  const totalItems = (showProducts ? products.length : 0) + (showDishes ? dishes.length : 0);

  // Scroll to top when items change (search) — скроллит общий outer-контейнер,
  // утаскивая и шапку обратно вверх. Гард глушит blur-on-scroll на этот рывок.
  useEffect(() => {
    isProgrammaticScrollRef.current = true;
    scrollerRef.current?.scrollTo({ top: 0 });
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, [totalItems, scrollerRef, isProgrammaticScrollRef]);

  // Compute max nutrient value across all products for richness bar scaling
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- результат примитив (number); референсная стабильность не важна, компилятор мемоизирует сам
  const richNutrientMax = useMemo(() => {
    if (!richNutrient?.id || nutrientMap.size === 0) return 0;
    let max = 0;
    for (const entries of nutrientMap.values()) {
      const val = entries.find((n) => n.nutrientId === richNutrient.id)?.quantity ?? 0;
      if (val > max) max = val;
    }
    return max;
  }, [richNutrient?.id, nutrientMap]);

  // Суточная норма выбранного нутриента (user-норма ?? дефолт). Считаем один раз
  // и прокидываем числом в каждую карточку, чтобы не дёргать хук в ~400 строках.
  // undefined у нутриентов без нормы → карточка покажет абсолютное значение.
  const userNormItems = useUserNormItems();
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- результат примитив (number | undefined); компилятор мемоизирует сам
  const richNutrientNorm = useMemo(() => {
    if (!richNutrient?.id) return undefined;
    // «нет официальной нормы» (сахар/крахмал/каротины) → % не считаем, остаётся
    // абсолютное значение. nutrientsHaveDailyNorm — канонический флаг (был мёртвый,
    // теперь подключён здесь и в useNutrientCard).
    if (nutrientsHaveDailyNorm[+richNutrient.id] !== true) return undefined;
    return userNormItems?.[richNutrient.id] ?? defaultDailyNorms[+richNutrient.id];
  }, [richNutrient?.id, userNormItems]);

  const onFoodAdd = useCallback(
    (item: { id: string; name: string }) =>
      onSelectFood({ variant: 'product', id: item.id, name: item.name }),
    [onSelectFood]
  );
  const onDishAdd = useCallback(
    (item: { id: string; name: string }) =>
      onSelectFood({ variant: 'dish', id: item.id, name: item.name }),
    [onSelectFood]
  );

  const trimmedQuery = searchQuery.trim();

  // When the host provides onPickCreate + createInputHtmlFor, the empty-state
  // actions delegate to a create-name modal via <label htmlFor> focus. Otherwise
  // fall back to the legacy toaster-based useFoodCreation flow.
  const productHandler = onPickCreate
    ? () => onPickCreate('product', trimmedQuery)
    : handleCreateProduct;
  const dishHandler = onPickCreate ? () => onPickCreate('dish', trimmedQuery) : handleCreateDish;

  const createButtons = (
    <FoodSearchEmpty
      onCreateProduct={showProducts ? productHandler : undefined}
      onCreateDish={showDishes ? dishHandler : undefined}
      createInputHtmlFor={createInputHtmlFor}
    />
  );

  const renderProductItem = useCallback(
    (item: (typeof products)[number]) => {
      const itemWithNutrients = richNutrient?.id
        ? {
            ...item,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            getTotalNutrients: (_qty: number) => {
              const entries = nutrientMap.get(item.id);
              if (!entries) return {};
              const result: Record<string, number> = {};
              for (const e of entries) result[e.nutrientId] = e.quantity;
              return result;
            },
          }
        : item;
      return (
        <FoodActionCard
          key={item.id}
          variant="product"
          item={itemWithNutrients}
          active={activeItemId === item.id}
          onClick={() => onFoodAdd(item)}
          onInfoClick={onInfoClick ? () => onInfoClick('product', item.id) : undefined}
          richNutrientId={richNutrient?.id}
          richNutrientUnit={richNutrient?.unit}
          richNutrientMax={richNutrientMax}
          richNutrientNorm={richNutrientNorm}
          htmlFor={itemHtmlFor}
          mineFilter={userOnlyProducts}
        />
      );
    },
    [
      activeItemId,
      onFoodAdd,
      onInfoClick,
      richNutrient,
      nutrientMap,
      richNutrientMax,
      richNutrientNorm,
      itemHtmlFor,
      userOnlyProducts,
    ]
  );

  const renderDishItem = useCallback(
    (item: (typeof dishes)[number]) => (
      <FoodActionCard
        key={item.id}
        variant="dish"
        item={item}
        active={activeItemId === item.id}
        onClick={() => onDishAdd(item)}
        onInfoClick={onInfoClick ? () => onInfoClick('dish', item.id) : undefined}
        htmlFor={itemHtmlFor}
        mineFilter={userOnlyProducts}
      />
    ),
    [activeItemId, onDishAdd, onInfoClick, itemHtmlFor, userOnlyProducts]
  );

  return (
    <>
      {/* Поток результатов сидит В ПОТОКЕ скролл-рута (outer `.scroller`), ПОСЛЕ
          шапки — шапка уезжает вверх вместе с ним. Кандидаты текут голыми на ambient
          (не owned-лист); лист-костюм заслуживается выбором. Сентинель наблюдает outer. */}
      <div className={styles.results}>
        {showProducts && <ul className={styles.list}>{products.map(renderProductItem)}</ul>}
        {showDishes && <ul className={styles.list}>{dishes.map(renderDishItem)}</ul>}
      </div>
      <div ref={sentinelRef} />
      {/* Инлайновые плитки «Продукт|Блюдо» остаются ТОЛЬКО для legacy-пути (без
          onPickCreate — toaster-консумеры). В create-флоу (onPickCreate задан)
          их заменяет постоянный нижний док в outer SearchFood, а выбор блюдо/
          продукт переехал в модалку создания. При richNutrient — прячем (режим
          фильтра по богатству). */}
      {!richNutrient && !onPickCreate && createButtons}

      {bottomLeft && <div className={styles.bottomLeft}>{bottomLeft}</div>}
    </>
  );
};

export default SearchFood;
