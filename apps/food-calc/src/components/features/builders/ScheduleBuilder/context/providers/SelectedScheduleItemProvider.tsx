import { createContext, ReactNode } from 'react';
import { Instance } from 'mobx-state-tree';
import { ScheduleFoodsItem } from '@/domain/schedule/scheduleFood/ScheduleFoods.model';
import { useSchedule } from './ScheduleProvider';

export const SelectedScheduleItemContext = createContext<
  Instance<typeof ScheduleFoodsItem> | undefined
>(undefined);

interface SelectedScheduleItemProviderProps {
  itemId: string;
  children: ReactNode;
}

export const SelectedScheduleItemProvider: React.FC<SelectedScheduleItemProviderProps> = ({
  itemId,
  children,
}) => {
  const schedule = useSchedule();
  const item = schedule.foods.getChildById(itemId);

  if (!item) throw new Error(`ScheduleItem with id "${itemId}" not found`);

  return (
    <SelectedScheduleItemContext.Provider value={item}>
      {children}
    </SelectedScheduleItemContext.Provider>
  );
};
