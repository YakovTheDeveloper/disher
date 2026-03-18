import { createContext, ReactNode } from 'react';

// TODO: full rewrite needed — replace MST drafts with Triplit/Zustand draft stores

type DraftItem = {
  eventDraft: any;
  foodDraft: any;
};

export const DraftScheduleFoodContext = createContext<DraftItem | undefined>(undefined);

interface DraftScheduleFoodProviderProps {
  children: ReactNode;
}

export const DraftScheduleFoodProvider: React.FC<DraftScheduleFoodProviderProps> = ({ children }) => {
  // TODO: get drafts from Zustand draft stores in entities
  const foodDraft = null;
  const eventDraft = null;

  return (
    <DraftScheduleFoodContext.Provider value={{ eventDraft, foodDraft }}>
      {children}
    </DraftScheduleFoodContext.Provider>
  );
};
