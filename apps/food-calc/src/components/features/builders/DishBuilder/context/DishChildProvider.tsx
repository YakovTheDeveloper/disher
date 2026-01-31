import { createContext, useContext, ReactNode } from 'react';
import { Instance } from 'mobx-state-tree';
import { useDish } from '@/components/features/builders/DishBuilder/context/DishProvider';
import { DishItem } from '@/domain/dish/Dish.model';

const SelectedDishItemContext = createContext<Instance<typeof DishItem> | undefined>(undefined);

export const SelectedDishItemProvider: React.FC<{
  itemId: string;
  children: ReactNode;
}> = ({ itemId, children }) => {
  const dish = useDish();
  const item = dish.getChildById(itemId);

  if (!item) throw new Error(`Dish item with id "${itemId}" not found`);

  return (
    <SelectedDishItemContext.Provider value={item}>{children}</SelectedDishItemContext.Provider>
  );
};

export const DraftDishItemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dish = useDish();
  const item = dish.draft.item;

  if (!item) throw new Error(`No draft was found`);

  return (
    <SelectedDishItemContext.Provider value={item}>{children}</SelectedDishItemContext.Provider>
  );
};

export const useSelectedDishItem = () => {
  const ctx = useContext(SelectedDishItemContext);
  if (!ctx) throw new Error('useSelectedDishItem must be used within SelectedDishItemProvider');
  return ctx;
};
