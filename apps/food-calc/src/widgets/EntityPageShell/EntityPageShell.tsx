import { useCallback, useMemo, type FocusEvent, type ReactNode, type Ref } from 'react';
import { format } from 'date-fns';
import { Screen } from '@/shared/ui/Screen';
import { SwipeDeck, type DeckSlide } from '@/shared/ui/SwipeDeck';
import { type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import {
  FoodPortionsManager,
  PortionCreateModals,
  AddPortionButton,
} from '@/features/food/food-portions-manager';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';

type Portion = { label: string; grams: number };

/**
 * Слот «Порции» второго слайда. Присутствие → дек двухслайдовый ([сущность,
 * 'Порции']); отсутствие → одинарный слайд без ряда табов (каталожный продукт).
 * Хранение прячет консумер: блюдо = таблица dish_portions, продукт = JSON-blob.
 */
export type EntityPortionsSlot = {
  rows: Portion[];
  /** Производная строка «Всё блюдо» — только у блюда. */
  implicitPortion?: Portion;
  /** Reserved-имена для collision-check в PortionCreateModals. */
  existingLabels: string[];
  unit?: string;
  onCreate: (portion: Portion) => void;
  onUpdate: (label: string, updates: Partial<Portion>) => void;
  onLongPressRow: (label: string) => void;
};

type Props = {
  /** Лейбл первой плитки (Блюдо / Продукт). titleStyle фиксирован — display-sans. */
  entityLabel: string;
  /** `location.state.from` origin; фолбэк — последняя посещённая дата расписания. */
  backFrom?: string;
  /** Кнопка «О!» бара. undefined → «О!» скрыта (каталожный продукт без хаба). */
  hub?: { onClick: () => void; ariaLabel: string };
  heroForSlide?: (i: number) => ReactNode;
  heroHeightForSlide?: (i: number) => number | null | undefined;
  /** Имя сущности в `topContent` каждого слайда (кликабельный rename-label). */
  nameHeading: ReactNode;
  /** Dropdown-меню правки в правом слоте первого слайда. undefined → нет (каталог). */
  editMenu?: ReactNode;
  firstSlideBody: ReactNode;
  firstSlideOverlay?: ReactNode;
  firstSlideBottomBar?: ReactNode;
  portions?: EntityPortionsSlot;
  /** Chrome-модалки (ChangeName/Description) — сосед SwipeDeck под focus-capture. */
  chrome?: ReactNode;
  onChromeFocusCapture?: (e: FocusEvent) => void;
};

/**
 * Общий каркас страницы сущности (Блюдо / Продукт) — извлечён из DishBuilderPage.
 * Владеет одинаковой обвязкой: SwipeDeck ([сущность, 'Порции']) + плавающий
 * HomeTopBar (back + иконка-календарь + опц. «О!») + два `Screen`-слайда
 * (headerOverlap, имя в topContent) + слайд порций (FoodPortionsManager +
 * AddPortionButton + PortionCreateModals). Консумер отдаёт слоты под сущность;
 * DishBuilderPage и ProductPage — тонкие адаптеры.
 */
export const EntityPageShell = ({
  entityLabel,
  backFrom,
  hub,
  heroForSlide,
  heroHeightForSlide,
  nameHeading,
  editMenu,
  firstSlideBody,
  firstSlideOverlay,
  firstSlideBottomBar,
  portions,
  chrome,
  onChromeFocusCapture,
}: Props) => {
  // Страница сущности бездатна — иконка-календарь ведёт к последней посещённой
  // дате расписания (escape hatch, паритет с бывшим DishBuilderPage). `date` для
  // HomeTopBar — это же service-значение; `noInterruptGuard` глушит date-switch confirm.
  const dateForTopBar = useMemo(() => {
    if (typeof window === 'undefined') return format(new Date(), 'dd-MM-yyyy');
    const stored = window.localStorage.getItem('lastVisitedScheduleDate');
    return stored ?? format(new Date(), 'dd-MM-yyyy');
  }, []);
  const backTo = backFrom ?? `/schedule/${dateForTopBar}`;

  const hubOnClick = hub?.onClick;
  const hubAriaLabel = hub?.ariaLabel;

  // Бар отдаётся в SwipeDeck через render-prop — каркас прокидывает `shellRef`
  // (scroll-hide). «О!» (onHubClick) рендерится ТОЛЬКО когда задан hub; без него
  // HomeTopBar.showHub=false → кнопка скрыта (каталожный продукт).
  const renderTopBar = useCallback(
    (shellRef: Ref<HTMLDivElement>) => (
      <HomeTopBar
        date={dateForTopBar}
        backSlot={<BackButton to={backTo} />}
        dateButtonLabel={<CalendarIcon width={22} height={22} />}
        noInterruptGuard
        onHubClick={hubOnClick}
        hubAriaLabel={hubAriaLabel}
        shellRef={shellRef}
      />
    ),
    [dateForTopBar, backTo, hubOnClick, hubAriaLabel]
  );

  // Плитки строятся из `screens` — стабильны (useMemo на примитивах: entityLabel
  // и hasPortions неизменны за жизнь страницы) → topSlot'ы SwipeDeck мемоизируются,
  // memo() слайдов держится. Deps НЕ `portions` (свежий объект каждый рендер сбросил
  // бы стабильность), а его наличие.
  const hasPortions = portions != null;
  const screens = useMemo<ScreenEntry[]>(
    () =>
      hasPortions
        ? [
            { label: entityLabel, titleStyle: 'display-sans' },
            { label: 'Порции', titleStyle: 'display-sans' },
          ]
        : [{ label: entityLabel, titleStyle: 'display-sans' }],
    [entityLabel, hasPortions]
  );

  // Каждый слайд = свой `<Screen>`, получающий topSlot (hero + плитки) в
  // `stickyTop`. Каркас (SwipeDeck) владеет container/стеклом/scroll-hide/свайпом.
  const slides: DeckSlide[] = [
    {
      render: (topSlot) => (
        <Screen
          key={0}
          headerOverlap
          topContent={nameHeading}
          topContentRight={editMenu}
          stickyTop={topSlot}
          overlay={firstSlideOverlay}
          bottomBar={firstSlideBottomBar}
        >
          {firstSlideBody}
        </Screen>
      ),
    },
  ];

  if (portions) {
    const { rows, implicitPortion, existingLabels, unit = 'г', onCreate, onUpdate, onLongPressRow } =
      portions;
    slides.push({
      render: (topSlot) => (
        <Screen
          key={1}
          headerOverlap
          topContent={nameHeading}
          stickyTop={topSlot}
          bottomBar={<AddPortionButton />}
          overlay={
            <PortionCreateModals existingLabels={existingLabels} unit={unit} onCreate={onCreate} />
          }
        >
          <FoodPortionsManager
            portions={rows}
            implicitPortion={implicitPortion}
            showHint={false}
            onUpdate={onUpdate}
            onLongPressRow={onLongPressRow}
          />
        </Screen>
      ),
    });
  }

  return (
    <>
      {/* Chrome-модалки: focus-delegation работает через расположение ИНПУТА
          (внутри модалки), поэтому они живут соседом SwipeDeck. Лейбл в
          nameHeading/editMenu редиректит фокус на нужный input по id →
          onChromeFocusCapture ловит и раскрывает модалку. */}
      {chrome != null && <div onFocusCapture={onChromeFocusCapture}>{chrome}</div>}
      <SwipeDeck
        screens={screens}
        slides={slides}
        defaultSlide={0}
        renderTopBar={renderTopBar}
        heroForSlide={heroForSlide}
        heroHeightForSlide={heroHeightForSlide}
      />
    </>
  );
};

export default EntityPageShell;
