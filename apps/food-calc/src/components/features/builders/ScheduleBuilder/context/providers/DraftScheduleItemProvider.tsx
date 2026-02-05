import { createContext, ReactNode } from 'react';
import { domainStore } from '@/store/store';
import { observer } from 'mobx-react-lite';

// Type for draft object compatible with existing hooks
type DraftItem = {
  eventDraft: typeof domainStore.scheduleStore.eventDraft;
  foodDraft: typeof domainStore.scheduleStore.foodDraft;
};

export const DraftScheduleItemContext = createContext<DraftItem | undefined>(undefined);

interface DraftScheduleItemProviderProps {
  children: ReactNode;
}

export const DraftScheduleItemProvider: React.FC<DraftScheduleItemProviderProps> = observer(
  ({ children }) => {
    const { foodDraft, eventDraft } = domainStore.scheduleStore;

    if (!foodDraft || !eventDraft) throw new Error(`No draft exist in store`);

    return (
      <DraftScheduleItemContext.Provider value={{ eventDraft, foodDraft }}>
        {children}
      </DraftScheduleItemContext.Provider>
    );
  }
);
