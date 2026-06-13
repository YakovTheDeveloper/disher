import { memo, useCallback, useMemo } from 'react';
import { parse, isValid } from 'date-fns';
import { drawerStore, modalStore } from '@/shared/ui';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { ScheduleNavigatorDrawer } from '@/features/schedule-navigator';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { AccountPanel } from '@/features/auth';
import styles from './HomeTopBar.module.scss';

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
  /** Абсолютно центрированный pill-слот для произвольного контента
   *  (без serif-overrides из `.centerLabel` — он заточен под имя
   *  продукта/блюда). Обёртка наследует bg/border/blur/shadow из
   *  `--bar-*` токенов, чтобы visual совпадал с accountSlot/dateSegment.
   *  HomePage кладёт сюда `<NutrientsSummaryButton/>`. Не совмещается
   *  с `centerLabel` — кто-то один. */
  centerSlot?: React.ReactNode;
  /** Suppress the date-switch interrupt guard in `handleDateClick` — skips
   *  BOTH the "analysis still streaming" confirm AND the
   *  `interrupt(date, 'date-switch')` call. Product / dish pages feed a
   *  service date (last-visited) just so the bar has a value: a confirm
   *  about that unrelated date's analysis is misplaced there, and its
   *  stream should keep running (it is store-managed and survives
   *  navigation away). Schedule pages (HomePage) leave this off so leaving
   *  a date they actually display still aborts the stream. */
  noInterruptGuard?: boolean;
  /** Если `false`, centerLabel не рендерится (даже если значение передано).
   *  Используется страницами блюда/продукта: сначала имя живёт в hero на
   *  странице, при скролле > N — страница выставляет `true`, и имя
   *  «возвращается» в центр бара. По умолчанию `true` для backward-compat
   *  с HomePage и любыми callers, которые не управляют видимостью. */
  centerLabelVisible?: boolean;
};

type DateParts = { weekday: string; ddmm: string };

const formatDateParts = (input: string): DateParts => {
  const date = parse(input, 'dd-MM-yyyy', new Date());
  if (!isValid(date)) {
    return { weekday: '', ddmm: input };
  }
  // Короткая форма дня недели («пн», «вт» …) — обвязка бара, не место для
  // полного «понедельник», который перегружал date-пилюлю по высоте/весу.
  // CSS `::first-letter` капитализирует → «Пн».
  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return { weekday, ddmm: `${dd}.${mm}` };
};

const DateButtonContent = ({ parts }: { parts: DateParts }) => {
  const { weekday, ddmm } = parts;
  return (
    <span className={styles.dateNumeral}>
      <span className={styles.dateWeekday}>{weekday}</span>
      <span className={styles.dateDdmm}>{ddmm}</span>
    </span>
  );
};

const HomeTopBar = ({
  date,
  backSlot,
  dateButtonLabel,
  centerLabel,
  onTitleClick,
  centerLabelHtmlFor,
  leadingSlot,
  centerSlot,
  noInterruptGuard,
  centerLabelVisible = true,
}: Props) => {
  const { toScheduleBuilder } = useAppRoutes();
  const dateParts = useMemo(() => formatDateParts(date), [date]);

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

    // Leaving the date mid-request interrupts the daily analysis (it cannot
    // resume). Confirm before navigating away; on confirm, abort the request
    // with the `date-switch` reason so the banner reads correctly.
    const loading =
      useDailyAnalysisStore.getState().byDate[date]?.status === 'loading';
    if (!noInterruptGuard && loading) {
      const confirmed = await modalStore.show(ConfirmModal, {
        title: 'Разбор ещё идёт',
        message: 'Если уйти на другую дату, разбор дня прервётся.',
        confirmLabel: 'Уйти',
        cancelLabel: 'Остаться',
      });
      if (confirmed !== true) return;
      useDailyAnalysisStore.getState().interrupt(date, 'date-switch');
    }

    toScheduleBuilder(selectedDate);
  }, [date, toScheduleBuilder, noInterruptGuard]);

  return (
    <div className={styles.shell}>
      <div className={styles.bar}>
        {backSlot}
        <div className={styles.accountSlot}>
          <AccountPanel />
        </div>
        {leadingSlot}
        {centerSlot != null && (
          <div className={styles.centerSlot}>{centerSlot}</div>
        )}
        {centerLabel != null && (
          centerLabelHtmlFor ? (
            <label
              htmlFor={centerLabelHtmlFor}
              className={`${styles.centerLabel} ${styles.centerLabelButton}`}
              data-hidden={centerLabelVisible ? undefined : 'true'}
              aria-label="Изменить название"
            >
              {centerLabel}
            </label>
          ) : onTitleClick ? (
            <button
              type="button"
              className={`${styles.centerLabel} ${styles.centerLabelButton}`}
              data-hidden={centerLabelVisible ? undefined : 'true'}
              onClick={onTitleClick}
              aria-label="Изменить название"
            >
              {centerLabel}
            </button>
          ) : (
            <span
              className={styles.centerLabel}
              data-hidden={centerLabelVisible ? undefined : 'true'}
            >
              {centerLabel}
            </span>
          )
        )}
        <button
          type="button"
          className={`${styles.segment} ${styles.dateSegment}`}
          onClick={handleDateClick}
          aria-label="Выбрать дату"
        >
          {dateButtonLabel != null ? (
            <span className={styles.dateLabel}>{dateButtonLabel}</span>
          ) : (
            <DateButtonContent parts={dateParts} />
          )}
        </button>
      </div>
    </div>
  );
};

export default memo(HomeTopBar);
