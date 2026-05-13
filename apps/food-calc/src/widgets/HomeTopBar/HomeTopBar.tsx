import { memo, useCallback, useMemo } from 'react';
import { parse, isValid } from 'date-fns';
import { drawerStore } from '@/shared/ui';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { ScheduleSelectionDrawer } from '@/features/ScheduleSelection/ScheduleSelectionDrawer';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import { AccountPanel } from '@/features/auth';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import styles from './HomeTopBar.module.scss';

const BAR_VARIANTS = ['glass', 'paper', 'floating', 'ribbon', 'ink-rule'] as const;
const DATE_VARIANTS = ['inline', 'stacked', 'numeral', 'pill', 'marquee'] as const;

type Props = {
  date: string;
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
};

type DrawerProps = BaseDrawerProps<void> & {
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
};

const NutrientsDrawer = ({ totals, missingNutrientNames, isLoading }: DrawerProps) => (
  <DrawerLayout>
    <div className={styles.drawerBody}>
      <FoodsNutrients
        totals={totals}
        missingNutrientNames={missingNutrientNames}
        isLoading={isLoading}
      />
    </div>
  </DrawerLayout>
);

type DateParts = { weekday: string; day: string; month: string; full: string };

const formatDateParts = (input: string): DateParts => {
  const date = parse(input, 'dd-MM-yyyy', new Date());
  if (!isValid(date)) {
    return { weekday: '', day: input, month: '', full: input };
  }
  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(date);
  const day = String(date.getDate());
  return { weekday, day, month, full: `${weekday} ${day} ${month}` };
};

type DateContentProps = {
  variant: typeof DATE_VARIANTS[number];
  parts: DateParts;
};

const DateButtonContent = ({ variant, parts }: DateContentProps) => {
  const { weekday, day, month, full } = parts;

  if (variant === 'stacked') {
    return (
      <span className={styles.dateStack}>
        <span className={styles.dateStackTop}>{weekday}</span>
        <span className={styles.dateStackBottom}>
          {day} {month}
        </span>
      </span>
    );
  }

  if (variant === 'numeral') {
    return (
      <span className={styles.dateNumeral}>
        <span className={styles.dateNumeralDay}>{day}</span>
        <span className={styles.dateNumeralMeta}>
          <span>{weekday}</span>
          <span>{month}</span>
        </span>
      </span>
    );
  }

  return (
    <>
      <span className={styles.dateLabel}>{full}</span>
      {variant === 'marquee' && (
        <span className={styles.dateChevron} aria-hidden>
          ▾
        </span>
      )}
    </>
  );
};

const HomeTopBar = ({ date, totals, missingNutrientNames, isLoading }: Props) => {
  const { toScheduleBuilder } = useAppRoutes();
  const dateParts = useMemo(() => formatDateParts(date), [date]);

  const { variant: dateVariant, anchor: dateAnchor } = useDesignVariant(
    'HomeTopBarDate',
    DATE_VARIANTS,
  );
  const { anchor: barAnchor } = useDesignVariant('HomeTopBar', BAR_VARIANTS);

  const handleNutrientsClick = useCallback(() => {
    drawerStore.show(NutrientsDrawer, { totals, missingNutrientNames, isLoading });
  }, [totals, missingNutrientNames, isLoading]);

  const handleDateClick = useCallback(async () => {
    const selectedDate = await drawerStore.show(ScheduleSelectionDrawer, {
      selectedDate: date,
    });
    if (selectedDate && selectedDate !== date) {
      toScheduleBuilder(selectedDate);
    }
  }, [date, toScheduleBuilder]);

  return (
    <div className={styles.shell} {...barAnchor}>
      <div className={styles.bar}>
        <div className={styles.accountSlot}>
          <AccountPanel />
        </div>
        <button
          type="button"
          className={styles.segment}
          onClick={handleNutrientsClick}
          aria-label="Открыть детали по нутриентам"
        >
          нутриенты
        </button>
        <button
          type="button"
          className={`${styles.segment} ${styles.dateSegment}`}
          onClick={handleDateClick}
          aria-label="Выбрать дату"
          {...dateAnchor}
        >
          <DateButtonContent variant={dateVariant} parts={dateParts} />
        </button>
      </div>
    </div>
  );
};

export default memo(HomeTopBar);
