import { createContext, useContext, ReactNode } from 'react';
import { Instance } from 'mobx-state-tree';
import { ScheduleItem } from '@/domain/schedule/schedule';
import { EventItem } from '@/domain/schedule/scheduleEvent/scheduleEvent';
import { useSchedule } from '@/components/features/builders/food/ScheduleBuilder/context/ScheduleProvider';

const SelectedScheduleItemContext = createContext<Instance<typeof ScheduleItem> | undefined>(
  undefined
);

export const useSelectedScheduleItem = () => {
  const ctx = useContext(SelectedScheduleItemContext);
  if (!ctx)
    throw new Error('useSelectedScheduleItem must be used within SelectedScheduleItemProvider');
  return ctx;
};

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

const SelectedEventItemContext = createContext<Instance<typeof EventItem> | undefined>(undefined);

export const useSelectedEventItem = () => {
  const ctx = useContext(SelectedEventItemContext);
  if (!ctx) throw new Error('useSelectedEventItem must be used within SelectedEventItemProvider');
  return ctx;
};

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
