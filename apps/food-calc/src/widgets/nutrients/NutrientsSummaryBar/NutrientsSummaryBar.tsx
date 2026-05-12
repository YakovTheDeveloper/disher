import { memo, useCallback, useMemo } from 'react';
import { parse, isValid } from 'date-fns';
import { drawerStore } from '@/shared/ui';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { ScheduleSelectionDrawer } from '@/features/ScheduleSelection/ScheduleSelectionDrawer';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import styles from './NutrientsSummaryBar.module.scss';

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

const formatDateLabel = (input: string) => {
  const date = parse(input, 'dd-MM-yyyy', new Date());
  if (!isValid(date)) return input;
  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(date);
  return `${weekday} ${date.getDate()} ${month}`;
};

const NutrientsSummaryBar = ({ date, totals, missingNutrientNames, isLoading }: Props) => {
  const { toScheduleBuilder } = useAppRoutes();
  const dateLabel = useMemo(() => formatDateLabel(date), [date]);

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
    <div className={styles.bar}>
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
        className={styles.segment}
        onClick={handleDateClick}
        aria-label="Выбрать дату"
      >
        {dateLabel}
      </button>
    </div>
  );
};

export default memo(NutrientsSummaryBar);
