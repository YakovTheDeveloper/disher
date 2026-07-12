import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  addDays,
  differenceInCalendarDays,
  format,
  getDay,
  getDaysInMonth,
  isSameDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { ActionTile, ArrowGlyph } from '@/shared/ui/atoms/ActionTile';
import { QuietLabel, Text } from '@/shared/ui/atoms/Typography';
import { EmptyState } from '@/shared/ui/EmptyState';
import { deriveFilledDates, useFilledDateKeys, useToday } from './hooks';
import { DATE_FORMAT, groupByMonth, parseKeys, type ParsedDay } from './lib';
import type { DateStr } from './model';
import s from './ScheduleNavigator.module.scss';

interface Props {
  onSelect: (date: DateStr) => void;
  selectedDate?: DateStr;
  /** Выравнивание ряда табов: `left` (дефолт) / `center`. Ставит `data-nav-align`
   *  на `.tabRow` (см. SwitcherTab / ScreenIndicator). */
  align?: 'left' | 'center';
  /**
   * Опциональный DOM-хост, в который ряд табов рендерится через `createPortal`
   * (вместо inline над панелями). Используется дровером: табы переезжают в
   * `header`-слот DrawerLayout (chrome-ряд), а тело несёт только панели-слайдер.
   * Портал сохраняет React-дерево — все хендлеры/Embla-состояние табов живут как
   * прежде, меняется лишь позиция в DOM. Не задан → табы рендерятся inline
   * (дефолт: HomeTopBar / DishBuilder / UiKit не трогаются).
   */
  tabPortal?: HTMLElement | null;
}

type NavTab = 'quick' | 'active';

// Два режима навигатора как ряд табов HomePage. Index ↔ tab по порядку.
// «Навигация» — якоря вчера/сегодня/завтра (частый прыжок); «Активные дни» —
// мини-календари по месяцам (дни с записями). Дефолт — всегда 'quick'.
const NAV_TAB_ORDER: NavTab[] = ['quick', 'active'];
const NAV_SCREENS: ScreenEntry[] = [
  { label: 'Навигация', titleStyle: 'display-sans' },
  { label: 'Активные дни', titleStyle: 'display-sans' },
];

// Доля высоты окна, до которой активная панель слайдера может расти, прежде чем
// начнёт скроллиться внутри (drawer «дышит» под текущую панель до этого потолка).
const PANEL_MAX_VH = 0.56;

// `inert` убирает неактивную панель из tab-order + a11y-дерева (её кнопки уехали
// за край, но живут в DOM ради замера/свайпа Embla). @types/react@18 ещё не знает
// `inert` (React-19 runtime его чтит, как и сам DOM) → прокидываем через spread с
// приведением типа. Пусто → панель интерактивна.
const inertWhen = (on: boolean) =>
  (on ? { inert: '' } : {}) as unknown as HTMLAttributes<HTMLElement>;

// ─── DayRow (anchors — three ActionTiles) ──────────────────────────────────
// Вчера/Сегодня/Завтра как общий примитив `ActionTile` (унификация 2026-06-21;
// «сегодня» возвращено 2026-07-05): относительное слово сверху (heading-голос),
// дата снизу (короткий день недели · dd.mm), глиф справа — стрелка ←/→ для
// вчера/завтра, точка-маркер для «сегодня». «Сегодня» несёт inverse-карту («ты
// здесь» — тёмная плитка-центр ряда), «есть записи» — тихую точку.
interface DayRowProps {
  day: ParsedDay;
  today: Date;
  isFilled: boolean;
  isSelected: boolean;
  onSelect: (dateStr: DateStr) => void;
}

const DayRow = memo(function DayRow({ day, today, isFilled, isSelected, onSelect }: DayRowProps) {
  const handleClick = useCallback(() => onSelect(day.dateStr), [day.dateStr, onSelect]);

  const diff = differenceInCalendarDays(day.date, today);
  // На quick-табе всегда вчера/сегодня/завтра; weekday — безопасный fallback.
  const relativeLabel =
    diff === 0
      ? 'сегодня'
      : diff === -1
        ? 'вчера'
        : diff === 1
          ? 'завтра'
          : format(day.date, 'EEEE', { locale: ru });

  // 'EEEEEE' = short standalone weekday in ru ("пн", "вт", …). dd.MM — дата.
  const weekdayShort = format(day.date, 'EEEEEE', { locale: ru });
  const ddmm = format(day.date, 'dd.MM');

  // Глиф: вчера ← / сегодня • / завтра → (fallback-дни без глифа).
  const glyphDir =
    diff === 0 ? 'dot' : diff === -1 ? 'left' : diff === 1 ? 'right' : undefined;

  return (
    <ActionTile
      data-date={day.dateStr}
      top={relativeLabel}
      // «Сегодня» — тёмная inverse-карта («ты здесь», центр ряда); вчера/завтра —
      // белые плитки-стрелки. (emphasis выбранного дня сейчас без стиля — no-op.)
      inverse={relativeLabel === 'сегодня'}
      bottom={`${weekdayShort} · ${ddmm}`}
      art={glyphDir ? <ArrowGlyph dir={glyphDir} /> : undefined}
      emphasis={isSelected}
      dot={isFilled}
      onClick={handleClick}
    />
  );
});

// ─── MonthCalendar (active-days — real 7-col mini-grid) ────────────────────
// Настоящая календарная решётка пн→вс на месяц: активные дни (есть записи) —
// яркие тапаемые ячейки, пустые — тусклый контекст (нетапаемые). Форма данных
// («логировал первую половину месяца, потом бросил») читается тепловой картой —
// то, что теряла лента жирных строк. today — кольцо, выбранный — заливка.
// Monday-first: локаль ru; смещение первого дня = (getDay+6)%7.
const WEEKDAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

interface MonthCalendarProps {
  monthDate: Date;
  name: string;
  year: string;
  filledSet: Set<DateStr>;
  today: Date;
  selectedDate?: DateStr;
  onSelect: (dateStr: DateStr) => void;
}

const MonthCalendar = memo(function MonthCalendar({
  monthDate,
  name,
  year,
  filledSet,
  today,
  selectedDate,
  onSelect,
}: MonthCalendarProps) {
  const monthStart = startOfMonth(monthDate);
  const daysInMonth = getDaysInMonth(monthStart);
  const lead = (getDay(monthStart) + 6) % 7; // сколько пустых ячеек до 1-го числа

  const cells: Array<number | null> = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  return (
    <div className={s.month}>
      <QuietLabel className={s.monthName}>
        {name}
        {"'"}
        {year}
      </QuietLabel>
      <div className={s.weekdayRow} aria-hidden>
        {WEEKDAY_LABELS.map((w) => (
          <Text key={w} as="span" role="caption" className={s.weekday}>
            {w}
          </Text>
        ))}
      </div>
      <div className={s.grid}>
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} className={s.blank} aria-hidden />;
          const date = addDays(monthStart, d - 1);
          const dateStr = format(date, DATE_FORMAT) as DateStr;
          const isActive = filledSet.has(dateStr);
          const isToday = isSameDay(date, today);
          const isSelected = dateStr === selectedDate;

          // Любой день тапаем — прыжок в календаре ведёт и в пустой день (нет
          // записей). Активный день «залит» (тепловая карта), пустой — тихий
          // бледный контекст, но остаётся кнопкой (можно перейти).
          return (
            <button
              key={dateStr}
              type="button"
              data-date={dateStr}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              className={clsx(
                s.cell,
                isActive ? s.cellActive : s.cellEmpty,
                isToday && s.cellToday,
                isSelected && s.cellSelected
              )}
              onClick={() => onSelect(dateStr)}
            >
              {/* Цифры дня = role="body" (16px, единый кегль всех ячеек). Активный
                  день (есть записи) несёт вес через примитив (weight="bold"), раньше —
                  сырой font-weight:600 в .cellActive. */}
              <Text as="span" role="body" weight={isActive ? 'bold' : undefined}>
                {d}
              </Text>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export const ScheduleNavigator = ({ onSelect, selectedDate, align = 'left', tabPortal }: Props) => {
  const today = useToday();
  const filledKeys = useFilledDateKeys();

  // Дефолт — всегда «Быстрая навигация» (якоря). «Активные дни» — явный тап/свайп.
  const { t } = useTranslation();
  const [tab, setTab] = useState<NavTab>('quick');

  // Слайдер = Embla (тот же движок, что во всём приложении — Swipeable). Клик по
  // табу → `emblaApi.scrollTo(i)` (надёжно, в отличие от прежнего нативного
  // `scroll-snap: x mandatory` + `scrollTo({smooth})`, который iOS WebKit
  // отменял); свайп → событие `select` двигает таб. `.viewport` = Embla-root
  // (overflow hidden), `.track` = Embla-container (flex-ряд слайдов). Высота
  // viewport «дышит» под активную панель (Embla трогает только горизонталь).
  const quickInnerRef = useRef<HTMLDivElement>(null);
  const activeInnerRef = useRef<HTMLDivElement>(null);
  const [viewportH, setViewportH] = useState<number>();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'x',
    loop: false,
    containScroll: 'trimSnaps',
    duration: 20,
    watchResize: true,
  });

  const tabIndex = tab === 'quick' ? 0 : 1;

  // Клик по табу → Embla доедет до панели; setTab оптимистично (событие `select`
  // подтвердит). Свайп сам стрельнёт `select` → setTab.
  const handleTabSelect = useCallback(
    (i: number) => {
      setTab(NAV_TAB_ORDER[i] ?? 'quick');
      emblaApi?.scrollTo(i);
    },
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const next = NAV_TAB_ORDER[emblaApi.selectedScrollSnap()] ?? 'quick';
      setTab((prev) => (prev === next ? prev : next));
    };
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Дровер въезжает анимацией — на первом кадре Embla может снять кривую ширину
  // слайда (см. тот же rAF-reInit в Swipeable). Переснимаем после первого paint'а.
  useEffect(() => {
    if (!emblaApi) return;
    const id = requestAnimationFrame(() => emblaApi.reInit());
    return () => cancelAnimationFrame(id);
  }, [emblaApi]);

  // Глубина через per-slide непрозрачность по scrollProgress (возможность Embla):
  // ушедший в сторону экран притушен — читается как «страница позади, её можно
  // долистать»; на свайпе он ПЛАВНО разгорается до полной яркости, привязанно к
  // пальцу, а не скачком на settle. Opacity не трогает layout → не спорит с
  // «дыханием» высоты и замерами панелей.
  useEffect(() => {
    if (!emblaApi) return;
    const NEIGHBOR_DIM = 0.55; // насколько гаснет полностью отъехавший слайд
    const apply = () => {
      const progress = emblaApi.scrollProgress();
      const slides = emblaApi.slideNodes();
      emblaApi.scrollSnapList().forEach((snap, i) => {
        const dist = Math.min(1, Math.abs(snap - progress));
        const node = slides[i];
        if (node) node.style.opacity = String(1 - dist * NEIGHBOR_DIM);
      });
    };
    apply();
    emblaApi.on('scroll', apply);
    emblaApi.on('reInit', apply);
    return () => {
      emblaApi.off('scroll', apply);
      emblaApi.off('reInit', apply);
    };
  }, [emblaApi]);

  const yesterdayStr = useMemo(() => format(subDays(today, 1), DATE_FORMAT), [today]);
  const todayStr = useMemo(() => format(today, DATE_FORMAT), [today]);
  const tomorrowStr = useMemo(() => format(addDays(today, 1), DATE_FORMAT), [today]);

  const filledAsc = useMemo(() => parseKeys(filledKeys), [filledKeys]);
  const filledSet = useMemo(() => deriveFilledDates(filledKeys), [filledKeys]);

  // «Активные дни» = ВСЕ дни с записями (прошлое + сегодня + будущее),
  // сгруппированы по месяцам ascending. В отличие от прежнего accordion'а
  // (только past) фильтр past-only снят — семантика таба = «есть данные».
  const activeGroups = useMemo(() => groupByMonth(filledAsc), [filledAsc]);
  const hasActive = filledAsc.length > 0;

  const yesterday = useMemo(() => subDays(today, 1), [today]);
  const anchors: ParsedDay[] = useMemo(
    () => [
      { date: yesterday, dateStr: yesterdayStr },
      { date: today, dateStr: todayStr },
      { date: addDays(today, 1), dateStr: tomorrowStr },
    ],
    [yesterday, yesterdayStr, today, todayStr, tomorrowStr]
  );

  const handleSelect = useCallback((dateStr: DateStr) => onSelect(dateStr), [onSelect]);

  // Active-days scroll: if selectedDate is among the active days, centre it on
  // tab mount; otherwise pin scroll to the bottom so the newest day is visible.
  const activeSectionRef = useRef<HTMLDivElement>(null);
  const selectedInActive = !!selectedDate && filledSet.has(selectedDate);

  // Directional fade hints: fade the top edge only when content is scrolled
  // above the fold, fade the bottom edge only when there's more below.
  const [fades, setFades] = useState({ top: false, bottom: false });
  const updateFades = useCallback(() => {
    const wrap = activeSectionRef.current;
    if (!wrap) return;
    const { scrollTop, scrollHeight, clientHeight } = wrap;
    const top = scrollTop > 1;
    const bottom = scrollTop + clientHeight < scrollHeight - 1;
    setFades((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  }, []);

  useLayoutEffect(() => {
    // Runs when «Активные дни» is active. Depends on `viewportH` so it re-centres
    // AFTER the breathing-height effect resizes the section (else centring is
    // computed against the stale, shorter quick-tab height). We set scrollTop
    // DIRECTLY on the known scroller (not `scrollIntoView`) — `scrollIntoView`
    // walks up through the Embla `translateX` container and can nudge the slider
    // horizontally.
    const wrap = activeSectionRef.current;
    if (!wrap || tab !== 'active' || !hasActive) return;
    if (selectedInActive) {
      const target = wrap.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`);
      if (target) {
        const tr = target.getBoundingClientRect();
        const wr = wrap.getBoundingClientRect();
        wrap.scrollTop += tr.top - wr.top - (wrap.clientHeight - tr.height) / 2;
        updateFades();
        return;
      }
    }
    wrap.scrollTop = wrap.scrollHeight;
    updateFades();
  }, [tab, hasActive, filledAsc, selectedDate, selectedInActive, viewportH, updateFades]);

  // «Дыхание» высоты: меряем НАТУРАЛЬНУЮ высоту контента активной панели
  // (inner-обёртка без height-ограничений) и ставим её на viewport с transition,
  // ограничивая потолком PANEL_MAX_VH (дальше панель скроллится внутри). Меряем
  // на смене таба, изменении данных и ресайзе окна.
  useLayoutEffect(() => {
    const measure = () => {
      const inner = tab === 'quick' ? quickInnerRef.current : activeInnerRef.current;
      if (!inner) return;
      const cap = window.innerHeight * PANEL_MAX_VH;
      setViewportH(Math.min(inner.offsetHeight, cap));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tab, filledAsc, hasActive]);

  // Ряд табов = тот же ScreenIndicator + вшитый NavSwitcher-облик, что на
  // HomePage (numerals-left по умолчанию). bandImg={false}: картинок нет. Когда
  // задан `tabPortal`, ряд едет в header-слот дровера через createPortal
  // (React-дерево цело → хендлеры/Embla-состояние сохраняются); иначе inline.
  const tabRow = (
    <div className={s.tabRow} data-nav-align={align}>
      <ScreenIndicator
        screens={NAV_SCREENS}
        activeIndex={tabIndex}
        onSelect={handleTabSelect}
        bandImg={false}
        // Внутри дровера masthead-регистр (display 46px) кричит над списком из
        // трёх строк — просим headline (28px): заголовок-переключатель, не постер.
        titleRole="headline"
        tablistLabel="Режим навигации"
      />
    </div>
  );

  return (
    <div className={s.shell}>
      {tabPortal ? createPortal(tabRow, tabPortal) : tabRow}

      {/* Слайдер: Embla (`emblaRef` = root). Высота viewport «дышит» под активную
          панель. `data-base-ui-swipe-ignore`: горизонтальный драг не должен
          триггерить вертикальный swipe-to-close bottom-sheet'а. Неактивная панель
          — `inert`: убрана из tab-order и a11y-дерева (её кнопки уезжают за край,
          но остаются в DOM ради замера/свайпа). */}
      <div
        className={s.viewport}
        ref={emblaRef}
        style={viewportH ? { height: `${viewportH}px` } : undefined}
        // Сторона растворения = сторона выглядывающего соседа: на 'quick' сосед
        // (активные дни) справа, на 'active' предыдущий экран слева.
        data-peek={tab === 'quick' ? 'right' : 'left'}
        data-base-ui-swipe-ignore=""
      >
        <div className={s.track}>
          <section className={s.panel} {...inertWhen(tab !== 'quick')} aria-label="Перейти к">
            <div className={s.anchorList} ref={quickInnerRef}>
              {/* Колонка плиток ActionTile под общим design-variant 'ActionTile'. */}
              <div className={s.navList}>
                {anchors.map((d) => (
                  <DayRow
                    key={d.dateStr}
                    day={d}
                    today={today}
                    isFilled={filledSet.has(d.dateStr)}
                    isSelected={selectedDate === d.dateStr}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className={s.panel} {...inertWhen(tab !== 'active')} aria-label="Активные дни">
            {hasActive ? (
              <div
                className={s.activeSection}
                ref={activeSectionRef}
                onScroll={updateFades}
                data-fade-top={fades.top || undefined}
                data-fade-bottom={fades.bottom || undefined}
              >
                {/* padding живёт на ИЗМЕРЯЕМОМ узле (не на .activeSection), иначе
                    24px верхнего отступа не входят в offsetHeight → панель на 24px
                    короче контента → ложный скролл. */}
                <div className={s.activeInner} ref={activeInnerRef}>
                  {activeGroups.map((g) => (
                    <MonthCalendar
                      key={g.key}
                      monthDate={g.items[0].date}
                      name={g.name}
                      year={g.year}
                      filledSet={filledSet}
                      today={today}
                      selectedDate={selectedDate}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className={s.empty} ref={activeInnerRef}>
                <EmptyState title={t('schedule.empty.days.title')} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ScheduleNavigator;
