import { createContext, useContext } from 'react';
import { useParams } from 'react-router';
import { domainStore } from '@/store/store';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleFood, ScheduleEventContainer } from '@/domain/schedule/schedule.model';
import { types } from 'mobx-state-tree';

const CombinedSchedule = types.compose("CombinedSchedule", ScheduleFood, ScheduleEventContainer)

export const ScheduleContext = createContext<Instance<typeof CombinedSchedule> | undefined>(undefined);

export const useSchedule = (): Instance<typeof CombinedSchedule> => {
  const ctx = useContext(ScheduleContext);

  if (ctx === undefined) {
    throw new Error('useSchedule must be used within ScheduleProvider');
  }

  return ctx;
};

const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { id: date } = useParams();
  const foodSchedule = domainStore.foodScheduleStore.data.get(date || '');
  const eventSchedule = domainStore.eventScheduleStore.data.get(date || '');

  // Create a combined view from both stores
  const combined = foodSchedule ? {
    ...foodSchedule,
    events: eventSchedule?.events
  } : undefined;

  return <ScheduleContext.Provider value={combined as any}>{children}</ScheduleContext.Provider>;
};

export default ScheduleProvider;
