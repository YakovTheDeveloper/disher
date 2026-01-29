import { createContext, useContext, ReactNode } from 'react';
import { Instance } from 'mobx-state-tree';
import { ScheduleItem } from '@/domain/schedule/schedule';
import { useDish } from '@/components/features/builders/DishBuilder/context/DishProvider';

const SelectedDishItemContext = createContext<Instance<typeof ScheduleItem> | undefined>(undefined);

export const useSelectedDishItem = () => {
  const ctx = useContext(SelectedDishItemContext);
  if (!ctx) throw new Error('useSelectedDishItem must be used within SelectedDishItemProvider');
  return ctx;
};

interface SelectedDishItemProviderProps {
  itemId: string;
  children: ReactNode;
}

export const SelectedDishItemProvider: React.FC<SelectedDishItemProviderProps> = ({
  itemId,
  children,
}) => {
  const dish = useDish();
  const item = dish.getChildById(itemId);

  if (!item) throw new Error(`ScheduleItem with id "${itemId}" not found`);

  return (
    <SelectedDishItemContext.Provider value={item}>{children}</SelectedDishItemContext.Provider>
  );
};
