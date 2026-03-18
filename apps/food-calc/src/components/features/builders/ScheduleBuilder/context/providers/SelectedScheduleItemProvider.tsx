import { createContext, ReactNode } from 'react';
import type { ScheduleFood } from '@/entities/schedule-food';
import { useSchedule } from './ScheduleProvider';

export const SelectedScheduleFoodContext = createContext<
  ScheduleFood | undefined
>(undefined);

interface SelectedScheduleFoodProviderProps {
  itemId: string;
  children: ReactNode;
}

export const SelectedScheduleFoodProvider: React.FC<SelectedScheduleFoodProviderProps> = ({
  itemId,
  children,
}) => {
  const schedule = useSchedule();
  const item = schedule.foods.getChildById(itemId);

  if (!item) throw new Error(`ScheduleFood with id "${itemId}" not found`);

  return (
    <SelectedScheduleFoodContext.Provider value={item}>
      {children}
    </SelectedScheduleFoodContext.Provider>
  );
};
