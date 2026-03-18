import { createContext, useContext } from 'react';
import { useParams } from 'react-router';

// TODO: full rewrite needed — replace MST CombinedSchedule with Triplit queries

type CombinedScheduleView = {
  // Placeholder type until Triplit migration is complete
  [key: string]: any;
};

export const ScheduleContext = createContext<CombinedScheduleView | undefined>(undefined);

export const useSchedule = (): CombinedScheduleView => {
  const ctx = useContext(ScheduleContext);

  if (ctx === undefined) {
    throw new Error('useSchedule must be used within ScheduleProvider');
  }

  return ctx;
};

const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { id: date } = useParams();

  // TODO: replace with Triplit useQuery hooks for food + event schedules
  const combined = undefined;

  return <ScheduleContext.Provider value={combined as any}>{children}</ScheduleContext.Provider>;
};

export default ScheduleProvider;
