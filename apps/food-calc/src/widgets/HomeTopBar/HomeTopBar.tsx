import { memo, useCallback, useMemo } from 'react';
import { parse, isValid } from 'date-fns';
import { drawerStore } from '@/shared/ui';
import { ScheduleNavigatorDrawer } from '@/features/schedule-navigator';
import { AnalysisHubDrawer } from '@/features/analysis/AnalysisHubDrawer';
import { useAppRoutes } from '@/shared/lib/routing/useAppRoutes';
import { AccountPanel } from '@/features/auth';
import { QuietLabel, Text } from '@/shared/ui/atoms/Typography';
import { HubButton } from '@/shared/ui/HubButton';
import styles from './HomeTopBar.module.scss';

// Дата-сегмент = день недели рядом с числом в ряд («Пт 18»). casing дня недели —
// фиксированный CSS-capitalize (сырьё Intl строчное «пт»); день — холодный ink,
// число — тёплый, чтобы слегка различались.

type Props = {
  date: string;
  /** Override the date-segment content entirely (bypasses dateVariant
   *  rendering). Accepts ReactNode so callers can pass an icon
   *  (e.g. CalendarIcon on product/dish pages instead of "К расписанию"). */
  dateButtonLabel?: React.ReactNode;
  /** Centred title rendered absolutely inside `.bar` — used by detail pages
   *  (product/dish) to show the entity name between the account-slot and the
   *  date-segment. Wraps up to 2 lines and is clipped beyond that. Stays out
   *  of flex flow so account/date stay pinned to the bar edges. */
  centerLabel?: React.ReactNode;
  /** When provided, the centre title becomes a button (clickable). Detail
   *  pages wire this to ChangeNameModal so tap-on-name = rename flow. */
  onTitleClick?: () => void;
  /** When provided, the centre title becomes `<label htmlFor=...>`. Used by
   *  detail pages (product / dish) to focus the rename input inside a
   *  `ModalByLabel`, which expands on focus capture. Takes precedence over
   *  `onTitleClick` if both are provided. */
  centerLabelHtmlFor?: string;
  /** Slot rendered as the VERY FIRST child of `.bar`, before the account pill.
   *  Detail pages (product / dish) put a `<BackButton>` here → the leading edge
   *  reads `[‹] [account] … [date]` (iOS leading-back canon). Inherits the
   *  `--bar-*` tokens so the ‹ pill matches the account / date pills. */
  backSlot?: React.ReactNode;
  /** Slot rendered after the account pill (before the date segment). Used by
   *  HomePage to mount mini-tile navigation inside the bar pill itself instead
   *  of stacking another absolute layer over it. */
  leadingSlot?: React.ReactNode;
  /** Skip the `selectedDate === date` early-return in `handleDateClick`.
   *  Product / dish pages feed a service date (last-visited) just so the bar
   *  has a value; picking that same date there should STILL navigate to
   *  `/schedule/<date>` (the user means "go there"), so they set this flag.
   *  Schedule pages (HomePage) leave it off — picking the date they already
   *  display is a no-op. (The former daily-stream interrupt confirm was
   *  removed 2026-07-02: the daily analysis is now a persisted POST job that
   *  survives navigation, so there is nothing to interrupt.) */
  noInterruptGuard?: boolean;
  /** Если `false`, centerLabel не рендерится (даже если значение передано).
   *  Используется страницами блюда/продукта: сначала имя живёт в hero на
   *  странице, при скролле > N — страница выставляет `true`, и имя
   *  «возвращается» в центр бара. По умолчанию `true` для backward-compat
   *  с HomePage и любыми callers, которые не управляют видимостью. */
  centerLabelVisible?: boolean;
  /** Ref на корневой `.shell`. Страницы со `Swipeable`-баром передают сюда
   *  `shellRef` из `useTopBarScrollHideController`, чтобы активный экран мог
   *  императивно писать `data-topbar-hide` (направление-зависимое скрытие
   *  кнопок при скролле). Обычный DOM-ref, ре-рендеров не вызывает. */
  shellRef?: React.Ref<HTMLDivElement>;
  /** Дата (dd-MM-yyyy), под которую открывается «Разбор»-хаб по кнопке «О!».
   *  Кнопка рендерится ТОЛЬКО когда передан `hubDate` — так якорь навигации
   *  живёт лишь на HomePage, а страницы продукта/блюда (тот же HomeTopBar) его
   *  не показывают. Открывает `AnalysisHubDrawer` через `drawerStore`. */
  hubDate?: string;
  /** Override-обработчик кнопки «О!». Страница блюда передаёт свой (открыть
   *  `DishHubDrawer`); когда задан, кнопка рендерится независимо от `hubDate`,
   *  а `onClick = onHubClick`. Home-путь (`hubDate` → `AnalysisHubDrawer`) не
   *  трогается: без `onHubClick` работает ровно как раньше. */
  onHubClick?: () => void;
  /** a11y-метка кнопки «О!». Home-хаб (по умолчанию) — «Разбор …»; страница
   *  блюда передаёт свою (открывает `DishHubDrawer`, а не «Разбор»), чтобы
   *  скринридер не читал неверное описание. */
  hubAriaLabel?: string;
};

// Подпись пилюли-навигации — короткий день недели рядом с числом дня, в ряд (стиль
// `.dateStack`). casing дня несёт CSS (text-transform: capitalize), поэтому отдаём
// СЫРУЮ строчную аббревиатуру Intl («пт»), без capitalize в строке. Возможный
// хвостовой «.» у некоторых движков срезаем.
const formatDateParts = (input: string): { weekday: string; day: string } => {
  const date = parse(input, 'dd-MM-yyyy', new Date());
  if (!isValid(date)) return { weekday: input, day: '' };
  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
    .format(date)
    .replace('.', '');
  return { weekday, day: String(date.getDate()).padStart(2, '0') };
};

const HomeTopBar = ({
  date,
  backSlot,
  dateButtonLabel,
  centerLabel,
  onTitleClick,
  centerLabelHtmlFor,
  leadingSlot,
  noInterruptGuard,
  centerLabelVisible = true,
  shellRef,
  hubDate,
  onHubClick,
  hubAriaLabel = 'Разбор — открытия и анализ',
}: Props) => {
  const { toScheduleBuilder } = useAppRoutes();
  const dateParts = useMemo(() => formatDateParts(date), [date]);
  const openHub = useCallback(() => {
    if (!hubDate) return;
    void drawerStore.show(AnalysisHubDrawer, { date: hubDate });
  }, [hubDate]);
  // Кнопка «О!» показывается на Home (передан `hubDate`) ИЛИ когда caller дал
  // свой override (`onHubClick`, страница блюда). onClick отдаёт приоритет
  // override'у, фолбэк — Home-хаб.
  const showHub = Boolean(onHubClick) || Boolean(hubDate);
  const handleHubClick = onHubClick ?? openHub;
  const handleDateClick = useCallback(async () => {
    const selectedDate = await drawerStore.show(ScheduleNavigatorDrawer, {
      selectedDate: date,
    });
    if (!selectedDate) return;
    // На страницах продукта/блюда (noInterruptGuard) `date` — это service-дата
    // (last-visited), а не дата, на которой мы стоим. Поэтому выбор «той же»
    // даты должен всё равно вести к /schedule/<date>, иначе клик на «Сегодня»
    // тихо ничего не делает. На страницах расписания (без guard) равенство
    // означает «остаёмся на месте» — там ранний return корректен.
    if (!noInterruptGuard && selectedDate === date) return;

    toScheduleBuilder(selectedDate);
  }, [date, toScheduleBuilder, noInterruptGuard]);

  return (
    <div className={styles.shell} ref={shellRef}>
      <div className={styles.bar}>
        {backSlot}
        <div className={styles.accountSlot}>
          <AccountPanel />
        </div>
        {/* «О!» — persistent «Разбор»-хаб. HomePage передаёт `hubDate`
            (→ AnalysisHubDrawer), страница блюда — `onHubClick` (→ DishHubDrawer).
            Общий примитив HubButton. */}
        {showHub ? <HubButton onClick={handleHubClick} ariaLabel={hubAriaLabel} /> : null}
        {leadingSlot}
        {centerLabel != null &&
          (centerLabelHtmlFor ? (
            <label
              htmlFor={centerLabelHtmlFor}
              className={`${styles.centerLabel} ${styles.centerLabelButton}`}
              data-hidden={centerLabelVisible ? undefined : 'true'}
              aria-label="Изменить название"
            >
              <QuietLabel>{centerLabel}</QuietLabel>
            </label>
          ) : onTitleClick ? (
            <button
              type="button"
              className={`${styles.centerLabel} ${styles.centerLabelButton}`}
              data-hidden={centerLabelVisible ? undefined : 'true'}
              onClick={onTitleClick}
              aria-label="Изменить название"
            >
              <QuietLabel>{centerLabel}</QuietLabel>
            </button>
          ) : (
            <QuietLabel
              className={styles.centerLabel}
              data-hidden={centerLabelVisible ? undefined : 'true'}
            >
              {centerLabel}
            </QuietLabel>
          ))}
        <button
          type="button"
          className={styles.dateSegment}
          onClick={handleDateClick}
          aria-label="Выбрать дату"
        >
          {dateButtonLabel != null ? (
            <span className={styles.dateLabel}>{dateButtonLabel}</span>
          ) : (
            // Только день недели (число временно скрыто, см. закомментированный
            // спан ниже). Голос — роль `label` обёртки, вес 700 как у соседней «О!».
            <Text as="span" role="label" className={styles.dateStack}>
              <span className={styles.dateColWeekday}>{dateParts.weekday}</span>
              {/* Число дня временно скрыто — оставлен только день недели.
              {dateParts.day && <span className={styles.dateColDay}>{dateParts.day}</span>}
              */}
            </Text>
          )}
        </button>
      </div>
    </div>
  );
};

export default memo(HomeTopBar);
