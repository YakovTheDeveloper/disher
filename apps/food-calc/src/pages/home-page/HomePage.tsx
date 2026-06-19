import { RouterLinks } from '@/app/router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import homeStyles from './HomePage.module.scss';
import { FoodSchedule } from '@/widgets/FoodSchedule';
import { ScheduleEvents } from '@/widgets/ScheduleEvents';
import { Laboratory } from '@/widgets/Laboratory';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { TopBarScrollHideContext, useTopBarScrollHideController } from '@/shared/ui/Screen';
import { SlideArtFrame } from './ui/SlideArtFrame';
import { HomeHero } from './ui/HomeHero';
import { useRecentlyAddedStore } from '@/shared/model/recentlyAddedStore';
import normsImg from '@/shared/assets/decarative/norms.png';
import { useRolloverNudge } from './useRolloverNudge';

const SCREENS: ScreenEntry[] = [
  { label: 'Открытия', image: '/art/experiment.png', titleStyle: 'display-sans' },
  { label: 'Рацион', image: '/art/schedule-food.png', titleStyle: 'display-sans' },
  { label: 'События', image: normsImg, titleStyle: 'display-sans' },
];

// NavSwitcher — affordance HomePage-табов. Anchor на `.swipeArea` (только
// HomePage — Dish/AtomBuilder не затронуты). Первый в массиве = живой дефолт →
// `tray-pill-bleed-hero`: hero-обложка-гравюра сверху + короткие текст-табы БЕЗ
// трея-подложки, утопленные в нижний fade обложки (верхний блок = единая рамка).
// Базовый облик HomePage. CSS: NavTile.module.scss (внутренности плитки/пилюли) +
// ScreenIndicator.module.scss (трей/fade-лифт) + HomeHero.module.scss (обложка),
// всё под `[data-dv='NavSwitcher']`.
//   tray-pill-bleed-hero  — БАЗА: графика в Hero сверху, пилюли — чистый текст,
//                           ряд утоплен в fade обложки (см. --home-tabs-lift)
//   hero-tabs-top         — форк hero: те же текст-табы, но подняты НАД обложкой
//                           (в зону бара). Порядок сверху-вниз: табы → обложка →
//                           заголовок листа. Снимает конфликт «табы vs заголовок»
//                           (две строки силы рядом), разводя их обложкой.
//   tab-as-title          — слияние табов и заголовка: АКТИВНЫЙ раздел = крупная
//                           жирная чёрная антиква-сан (облик Masthead), на своей
//                           строке; неактивные — тихие мелкие указатели ниже.
//                           Masthead-заголовок СКРЫТ (нет дубля), гравюра сверху.
//                           Лево-выровненный (редакционный, асимметрия).
//   tab-as-title-center   — то же слияние, но активный заголовок и указатели
//                           по центру.
//   tab-inplace           — слияние, но активный заголовок остаётся В РЯДУ на
//                           своём месте (короткий лейбл таба жирным «садится» в
//                           позицию активного); неактивные жмутся вплотную к нему,
//                           кластер наклоняется к стороне активного таба.
//   tab-inplace-rule      — tab-inplace + тонкая чернильная линейка под активным
//                           («музейный» индикатор выбранного).
//   tab-numerals          — own-line заголовок (по центру) + индикатор «номера
//                           таблиц» I·II·III (вместо точек) — дневник-натуралист.
//   tab-numerals-left     — то же, но заголовок и номера лево-выровнены
//                           (редакционная асимметрия, как tab-as-title).
const NAV_SWITCHER_VARIANTS = [
  'tab-as-title',
  'tab-as-title-center',
  'tab-inplace',
  'tab-numerals',
  'tab-numerals-left',
] as const;

// SheetMaterial — «история» материала контент-листа Screen: как мирятся стеклянный
// верх и бумажный низ. Anchor на `.container` (корень HomePage, предок листа) —
// несёт активацию стекла (band-bg прозрачна, веиль, blur, белый логотип) в БАЗЕ оси,
// поэтому варианты могут её переопределять. Базовый divider-шов скрыт (нет
// разделителя по дефолту). Токены доезжают до `.headerOverlap` / `.sheetBand`
// (Screen.module.scss). CSS-карта — HomePage.module.scss.
//   band      — БАЗА: стеклянная полка сверху + сплошная бумага ниже (текущее).
//   dissolve  — верх плавно растворяется из стекла в бумагу, шва нет.
const SHEET_MATERIAL_VARIANTS = ['band', 'dissolve'] as const;

// Облик подписей табов (small-caps serif + чернильная линейка под активным)
// вшит как канон прямо в NavTile.module.scss под структурой NavSwitcher hero —
// бывшая DEV-ось `HomeTabs` убрана из DesignBar (выбран smallcaps-rule).

const DEFAULT_SLIDE = 1;
// Ambient backdrop переехал на app-уровень (App.tsx `useDesignVariant('HomeAmbient')`
// на `.main`) — один глобальный переключатель свечения для всех страниц.
// Embla programmatic-scroll duration (frame-loop units). Сокращён
// относительно дефолта 25, потому что юзер добавил margin между слайдами:
// scroll-дистанция выросла → spring-кривая Embla в конце давала visible
// drop ("11111110099"). Меньшее окно (~300ms) делает spring менее заметным.
// На пользовательский свайп не влияет — там momentum, не `duration`.
const SWIPE_DURATION = 0;

const Page = ({ date }: { date: string }) => {
  // Тон страницы задаёт глобальный ModalShell-вариант (App.tsx → body
  // [data-modal-fields]). Своего surface больше нет — HomePage следует общему
  // «законодателю» (см. tds/modalshell-lawgiver-2026-06-13).
  const scheduleFoods = useScheduleFoods(date);
  const scheduleEvents = useScheduleEvents(date);

  const items = scheduleFoods;
  // НЕ делать `[...scheduleEvents]` — spread даёт новую ссылку на каждом
  // рендере HomePage и убивает memo на ScheduleEvents (props всегда «новые»).
  const events = scheduleEvents as ScheduleEvent[];

  const swipeableRef = useRef<SwipeableRef>(null);

  // Anchor для аудита affordance NavTile-табов (см. NAV_SWITCHER_VARIANTS).
  // Висит на `.swipeArea` — общий предок всех трёх слайдов → одним атрибутом
  // покрывает плитки во всех табах, и только на HomePage.
  const { anchor: navSwitcherAnchor } = useDesignVariant('NavSwitcher', NAV_SWITCHER_VARIANTS);

  // Ось «истории» материала листа (см. SHEET_MATERIAL_VARIANTS). Якорь на
  // `.container` — корневой предок, чтобы база оси перебивала дефолты и доезжала
  // до листа Screen внутри слайдов.
  const { anchor: sheetMaterialAnchor } = useDesignVariant('SheetMaterial', SHEET_MATERIAL_VARIANTS);

  // Направление-зависимое скрытие кнопок бара при скролле (см. topBarScrollHide).
  // Контроллер пишет `data-topbar-hide` на `.shell` бара императивно — свайп и
  // скролл остаются zero-React-render.
  const { shellRef, setHide, api: topBarHideApi } = useTopBarScrollHideController();

  // «Недавно добавлен»-кружки (еда + события) живут до первого свайпа слайда
  // или ухода со страницы. Чистка идёт через zustand-стор → ре-рендерятся
  // только сами «свежие» строки (теряют кружок), Page не подписан и не
  // ре-рендерится — свайп остаётся zero-React-render (Embla двигает DOM сам).
  const clearRecent = useCallback(() => {
    useRecentlyAddedStore.getState().clear();
  }, []);
  // Уход со страницы / смена даты — сбросить пометки (cleanup на размонтаж и
  // перед сменой date).
  useEffect(() => clearRecent, [date, clearRecent]);

  // Смена слайда → бар возвращается видимым (новый экран читается «с верха»),
  // заодно чистим «недавно добавлен»-кружки. Стабилен (deps стабильны) → Embla
  // не переподписывает листенеры каждый рендер.
  const handleIndexChange = useCallback(() => {
    clearRecent();
    setHide('none');
  }, [clearRecent, setHide]);

  // Preload bandImg PNG'шек: на первый клик по тайлу image уже в HTTP-кеше,
  // decode <1ms → CSS-fade стартует на готовых пикселях, нет "pop"
  // (cold-cache decode ~50-150ms на iOS WebKit съедал первую часть
  // opacity-анимации).
  useEffect(() => {
    SCREENS.forEach((s) => {
      if (!s.image) return;
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  // Сумма нутриентов за день теперь живёт в полосе-сводке в конце списка еды
  // (FoodSchedule → NutrientsBar), а не в пилюле верхнего бара — пилюлю убрали.

  // Каждый слайд рендерит свой статичный ScreenIndicator (slideIndex={0/1/2}),
  // поэтому индикаторы статичны. Свайп больше не ре-рендерит Page
  // (handleIndexChange — только imperative-чистка), слайд-виджеты и индикаторы
  // мемоизированы со стабильными пропсами → Embla двигает DOM сам.
  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
  }, []);

  // Заголовок дня внутри листа снят (2026-06-14): на всех трёх слайдах шапку
  // теперь несёт общий `Masthead` (Анализ / Еда и нутриенты / События дня),
  // выбранный день читается в HomeTopBar (Суббота · 13.06).

  // ScreenIndicator передаётся в каждый слайд как `topSlot`. slideIndex={0/1/2}
  // → каждый инстанс статично показывает СВОЙ экран (label, image, highlight'-
  // нутый тайл). Заголовок дня тут больше НЕ живёт — он переехал в
  // `contentHeader` листа (см. dayHeading ниже). Зависимость useMemo — stable
  // handleSelect → memo на слайд-виджетах держит, свайп = ноль React-ре-рендеров.
  // topSlot каждого слайда = Hero (статичная обложка) НАД ScreenIndicator.
  // Hero виден только в hero-варианте (gate в HomeHero.module.scss); оба сидят
  // в `stickyTop` слайда, поэтому лист контента (`.headerOverlap`, z-index:1)
  // при скролле наезжает на них. 3 слайда → 3 одинаковых Hero.
  const labIndicator = useMemo(
    () => (
      <>
        <HomeHero slide={0} />
        <ScreenIndicator screens={SCREENS} onSelect={handleSelect} slideIndex={0} bandImg={false} />
      </>
    ),
    [handleSelect]
  );
  const foodIndicator = useMemo(
    () => (
      <>
        <HomeHero slide={1} />
        <ScreenIndicator screens={SCREENS} onSelect={handleSelect} slideIndex={1} bandImg={false} />
      </>
    ),
    [handleSelect]
  );
  const eventsIndicator = useMemo(
    () => (
      <>
        <HomeHero slide={2} />
        <ScreenIndicator screens={SCREENS} onSelect={handleSelect} slideIndex={2} bandImg={false} />
      </>
    ),
    [handleSelect]
  );

  return (
    <div className={homeStyles.container} {...sheetMaterialAnchor}>
      <HomeTopBar date={date} shellRef={shellRef} />
      <div className={homeStyles.swipeArea} {...navSwitcherAnchor}>
        <TopBarScrollHideContext.Provider value={topBarHideApi}>
          <div className={homeStyles.tabsAnchor}>
          <Swipeable
            ref={swipeableRef}
            defaultSlide={DEFAULT_SLIDE}
            duration={SWIPE_DURATION}
            hasDots={false}
            onIndexChange={handleIndexChange}
          >
            <SlideArtFrame>
              {/* Экран 1 (Открытия) — чтение: при скролле вниз уезжают ВСЕ кнопки. */}
              <Laboratory key={date} date={date} topSlot={labIndicator} topBarHide="all" />
            </SlideArtFrame>
            <SlideArtFrame>
              {/* Экран 2 (Рацион) — уезжают только настройки (нутриенты+дата нужны). */}
              <FoodSchedule
                key={date}
                date={date}
                items={items}
                topSlot={foodIndicator}
                topBarHide="settings"
              />
            </SlideArtFrame>
            <SlideArtFrame>
              {/* Экран 3 (События) — уезжают только настройки. */}
              <ScheduleEvents
                key={date}
                date={date}
                events={events}
                topSlot={eventsIndicator}
                topBarHide="settings"
              />
            </SlideArtFrame>
          </Swipeable>
          </div>
        </TopBarScrollHideContext.Provider>
      </div>
    </div>
  );
};

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.id;
  const navigate = useNavigate();

  // Если день перевалил за полночь, пока приложение было в фоне, а юзер «следил
  // за сегодня» — мягко предлагаем тостером перейти на новое сегодня.
  useRolloverNudge(date);

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.ScheduleDateSelection);
    } else {
      sessionStorage.setItem('lastScheduleBuilderId', date);
      localStorage.setItem('lastVisitedScheduleDate', date);
    }
  }, [date]);

  if (!date) return null;

  return <Page date={date} />;
};

export default GetDatePageWrapper;
