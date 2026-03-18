import { createContext, ReactNode } from 'react';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { useSchedule } from './ScheduleProvider';

export const SelectedEventItemContext = createContext<ScheduleEvent | undefined>(
  undefined
);

interface SelectedEventItemProviderProps {
  itemId: string;
  children: ReactNode;
}

export const SelectedEventItemProvider: React.FC<SelectedEventItemProviderProps> = ({
  itemId,
  children,
}) => {
  const schedule = useSchedule();
  const item = schedule.events.getChildById(itemId);

  if (!item) throw new Error(`EventItem with id "${itemId}" not found`);

  return (
    <SelectedEventItemContext.Provider value={item}>{children}</SelectedEventItemContext.Provider>
  );
};
