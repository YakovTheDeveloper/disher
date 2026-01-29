import { createContext, ReactNode } from 'react';
import { Instance } from 'mobx-state-tree';
import { EventItem } from '@/domain/schedule/scheduleEvent/scheduleEvent';
import { useSchedule } from './ScheduleProvider';

export const SelectedEventItemContext = createContext<Instance<typeof EventItem> | undefined>(
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
