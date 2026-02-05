import { createContext, useContext } from 'react';
import { useParams } from 'react-router';
import { domainStore } from '@/store/store';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule.model';

export const ScheduleContext = createContext<Instance<typeof DaySchedule> | undefined>(undefined);

export const useSchedule = (): Instance<typeof DaySchedule> => {
  const ctx = useContext(ScheduleContext);

  if (ctx === undefined) {
    throw new Error('useSchedule must be used within ScheduleProvider');
  }

  return ctx;
};

const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { id: date } = useParams();
  const schedule = domainStore.scheduleStore.data.get(date || '');

  return <ScheduleContext.Provider value={schedule}>{children}</ScheduleContext.Provider>;
};

export default ScheduleProvider;
