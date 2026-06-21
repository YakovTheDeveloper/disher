import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format, isSameDay, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { ActionTile, ArrowGlyph, ACTION_TILE_VARIANTS } from '@/shared/ui/atoms/ActionTile';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { deriveFilledDates, useFilledDateKeys, useToday } from './hooks';
import { DATE_FORMAT, groupByMonth, parseKeys, type ParsedDay } from './lib';
import type { DateStr } from './model';
import s from './ScheduleNavigator.module.scss';

interface Props {
  onSelect: (date: DateStr) => void;
  selectedDate?: DateStr;
}

type NavTab = 'quick' | 'active';

// Два режима навигатора как ряд табов HomePage. Index ↔ tab по порядку.
// «Навигация» — якоря вчера/сегодня/завтра (частый прыжок); «Активные дни» —
// все дни с записями чипами. Дефолт — всегда 'quick'.
const NAV_TAB_ORDER: NavTab[] = ['quick', 'active'];
const NAV_SCREENS: ScreenEntry[] = [
  { label: 'Перейти к', titleStyle: 'display-sans' },
  { label: 'Активные дни', titleStyle: 'display-sans' },
];

// Доля высоты окна, до которой активная панель слайдера может расти, прежде чем
// начнёт скроллиться внутри (drawer «дышит» под текущую панель до этого потолка).
const PANEL_MAX_VH = 0.56;

// Тот же anchor и список вариантов, что у HomePage (`pages/home-page/HomePage`).
// `useDesignVariant` хранит выбор глобально по ключу 'NavSwitcher', поэтому
// переключение варианта в DesignBar меняет облик табов HomePage И этого drawer'а
// разом. Первый элемент = живой дефолт = 'tab-as-title' (активный раздел =
// крупный заголовок own-line, неактивный — тихий указатель ниже). Массив зеркалит
// HomePage; держать в синхроне (FSD не даёт импортить из pages).
const NAV_SWITCHER_VARIANTS = [
  'tab-as-title',
  'tab-as-title-center',
  'tab-inplace',
  'tab-numerals',
  'tab-numerals-left',
] as const;

// ─── DayRow (anchors — three ActionTiles) ──────────────────────────────────
// Вчера/Сегодня/Завтра как общий примитив `ActionTile` (унификация 2026-06-21):
// относительное слово сверху (heading-голос), дата снизу (короткий день недели ·
// dd.mm), глиф справа — стрелка ←/→ для вчера/завтра, точка для «сегодня». today
// несёт active («ты здесь»), выбранный — emphasis, «есть записи» — тихую точку.
// Облик поверхности (grad / shadow) приходит с контейнера через design-variant.
interface DayRowProps {
  day: ParsedDay;
  today: Date;
  isFilled: boolean;
  isSelected: boolean;
  onSelect: (dateStr: DateStr) => void;
}

const DayRow = memo(function DayRow({ day, today, isFilled, isSelected, onSelect }: DayRowProps) {
  const handleClick = useCallback(() => onSelect(day.dateStr), [day.dateStr, onSelect]);

  const isToday = isSameDay(day.date, today);
  const diff = differenceInCalendarDays(day.date, today);
  // На quick-табе всегда вчера/сегодня/завтра; weekday — безопасный fallback.
  const relativeLabel =
    diff === 0 ? 'сегодня' : diff === -1 ? 'вчера' : diff === 1 ? 'завтра' : format(day.date, 'EEEE', { locale: ru });

  // 'EEEEEE' = short standalone weekday in ru ("пн", "вт", …) — тот же формат,
  // что у пилюли бара (DayChip тоже). dd.MM — моноширинные цифры даты.
  const weekdayShort = format(day.date, 'EEEEEE', { locale: ru });
  const ddmm = format(day.date, 'dd.MM');

  // Глиф направления: вчера ← / сегодня • / завтра → (fallback-дни без глифа).
  const glyphDir = diff === 0 ? 'dot' : diff === -1 ? 'left' : diff === 1 ? 'right' : undefined;

  return (
    <ActionTile
      data-date={day.dateStr}
      top={relativeLabel}
      bottom={`${weekdayShort} · ${ddmm}`}
      art={glyphDir ? <ArrowGlyph dir={glyphDir} /> : undefined}
      active={isToday}
      emphasis={isSelected && !isToday}
      dot={isFilled}
      onClick={handleClick}
    />
  );
});

// ─── DayChip (past — compact, flex-wrap) ───────────────────────────────────
interface DayChipProps {
  day: ParsedDay;
  today: Date;
  isSelected: boolean;
  onSelect: (dateStr: DateStr) => void;
}

const DayChip = memo(function DayChip({ day, today, isSelected, onSelect }: DayChipProps) {
  const handleClick = useCallback(() => onSelect(day.dateStr), [day.dateStr, onSelect]);
  const isToday = isSameDay(day.date, today);
  const dayNumber = format(day.date, 'd');
  // 'EEEEEE' = short standalone in ru locale ("пн", "вт", ...). Compact and
  // unambiguous unlike narrow 1-char form.
  const weekdayShort = format(day.date, 'EEEEEE', { locale: ru });

  const className = [s.dayChip, isToday && s.dayChipToday, isSelected && s.dayChipSelected]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} onClick={handleClick} data-date={day.dateStr}>
      <span className={s.dayChipNumber}>{dayNumber}</span>
      <span className={s.dayChipWeekday}>{weekdayShort}</span>
    </button>
  );
});

// ─── ScheduleNavigator ─────────────────────────────────────────────────────
export const ScheduleNavigator = ({ onSelect, selectedDate }: Props) => {
  const today = useToday();
  const filledKeys = useFilledDateKeys();

  // Дефолт — всегда «Быстрая навигация» (якоря). «Активные дни» — явный тап/свайп.
  const [tab, setTab] = useState<NavTab>('quick');
  const { anchor: navAnchor } = useDesignVariant('NavSwitcher', NAV_SWITCHER_VARIANTS);
  // Облик якорей-плиток (grad / shadow) — общий design-variant 'ActionTile',
  // флипается DesignBar'ом разом с дровером анализа и панелью поиска.
  const { anchor: tileAnchor } = useDesignVariant('ActionTile', ACTION_TILE_VARIANTS);

  // Горизонтальный CSS scroll-snap слайдер: viewport со снапом + две панели по
  // 100% ширины. Таб ↔ панель синхронизированы в обе стороны (клик скроллит,
  // свайп обновляет таб). Высота viewport «дышит» под активную панель.
  const viewportRef = useRef<HTMLDivElement>(null);
  const quickInnerRef = useRef<HTMLDivElement>(null);
  const activeInnerRef = useRef<HTMLDivElement>(null);
  const [viewportH, setViewportH] = useState<number>();

  // Клик по табу → плавный снап к его панели. setTab — оптимистично; свайп всё
  // равно подтвердит через onViewportScroll.
  const handleTabSelect = useCallback((i: number) => {
    setTab(NAV_TAB_ORDER[i] ?? 'quick');
    const vp = viewportRef.current;
    if (vp) vp.scrollTo({ left: i * vp.clientWidth, behavior: 'smooth' });
  }, []);

  // Свайп → активный таб по ближайшей панели (functional-guard гасит лишние
  // ре-рендеры на каждом scroll-тике).
  const onViewportScroll = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || vp.clientWidth === 0) return;
    const idx = Math.round(vp.scrollLeft / vp.clientWidth);
    const next = NAV_TAB_ORDER[idx] ?? 'quick';
    setTab((prev) => (prev === next ? prev : next));
  }, []);

  const todayStr = useMemo(() => format(today, DATE_FORMAT), [today]);
  const yesterdayStr = useMemo(() => format(subDays(today, 1), DATE_FORMAT), [today]);
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
    // The active section is mounted only while its tab is open (ref is null on
    // the quick tab), so this runs when the user switches to «Активные дни».
    const wrap = activeSectionRef.current;
    if (!wrap || tab !== 'active' || !hasActive) return;
    if (selectedInActive) {
      const target = wrap.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`);
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'auto' });
        updateFades();
        return;
      }
    }
    wrap.scrollTop = wrap.scrollHeight;
    updateFades();
  }, [tab, hasActive, filledAsc, selectedDate, selectedInActive, updateFades]);

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

  return (
    <div className={s.shell}>
      {/* Ряд табов = тот же ScreenIndicator + NavSwitcher-anchor, что на
          HomePage → идентичный облик (дефолт tab-as-title), и DesignBar меняет
          оба разом. bandImg={false}: картинок у режимов нет. */}
      <div className={s.tabRow} {...navAnchor}>
        <ScreenIndicator
          screens={NAV_SCREENS}
          activeIndex={tab === 'quick' ? 0 : 1}
          onSelect={handleTabSelect}
          bandImg={false}
          tablistLabel="Режим навигации"
        />
      </div>

      {/* Слайдер: горизонтальный scroll-snap. Высота — от активной панели
          (дышит). `data-base-ui-swipe-ignore`: горизонтальный драг не должен
          триггерить вертикальный swipe-to-close bottom-sheet'а. */}
      <div
        className={s.viewport}
        ref={viewportRef}
        onScroll={onViewportScroll}
        style={viewportH ? { height: `${viewportH}px` } : undefined}
        data-base-ui-swipe-ignore=""
      >
        <section className={s.panel} aria-hidden={tab !== 'quick'} aria-label="Перейти к">
          <div className={s.anchorList} ref={quickInnerRef}>
            {/* Колонка плиток ActionTile под общим design-variant 'ActionTile'. */}
            <div className={s.navList} {...tileAnchor}>
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

        <section className={s.panel} aria-hidden={tab !== 'active'} aria-label="Активные дни">
          {hasActive ? (
            <div
              className={s.activeSection}
              ref={activeSectionRef}
              onScroll={updateFades}
              data-fade-top={fades.top || undefined}
              data-fade-bottom={fades.bottom || undefined}
            >
              <div ref={activeInnerRef}>
                {activeGroups.map((g) => (
                  // Month name is the first inline item of the chip row — chips
                  // have no backing, so it shows through the wrap flow without
                  // claiming a column.
                  <div key={g.key} className={s.chipRow}>
                    <span className={s.monthName}>
                      <span>
                        {g.name}
                        {"'"}
                      </span>
                      <span>{g.year}</span>
                    </span>
                    {g.items.map((d) => (
                      <DayChip
                        key={d.dateStr}
                        day={d}
                        today={today}
                        isSelected={selectedDate === d.dateStr}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={s.empty} ref={activeInnerRef}>
              Пока нет дней с записями
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ScheduleNavigator;
