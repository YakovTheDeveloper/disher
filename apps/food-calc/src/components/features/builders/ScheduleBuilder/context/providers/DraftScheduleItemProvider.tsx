import { createContext, ReactNode } from 'react';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { useSchedule } from './ScheduleProvider';
import { observer } from 'mobx-react-lite';

type DayScheduleInstance = Instance<typeof DaySchedule>;
export const DraftScheduleItemContext = createContext<DayScheduleInstance['draft'] | undefined>(
  undefined
);

interface DraftScheduleItemProviderProps {
  children: ReactNode;
}

export const DraftScheduleItemProvider: React.FC<DraftScheduleItemProviderProps> = observer(
  ({ children }) => {
    const schedule = useSchedule();
    const item = schedule.draft;

    console.log('DraftScheduleItemProvider', item);

    if (!item) throw new Error(`NO draft exist`);

    return (
      <DraftScheduleItemContext.Provider value={item}>{children}</DraftScheduleItemContext.Provider>
    );
  }
);
