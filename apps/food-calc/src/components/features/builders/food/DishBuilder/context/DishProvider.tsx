import { createContext, useContext } from 'react';
import { useParams } from 'react-router';
import { domainStore } from '@/store/store';
import { Instance } from 'mobx-state-tree';
import { Dish } from '@/domain/dish/Dish';

export const DishContext = createContext<Instance<typeof Dish> | undefined>(undefined);

export const useDish = (): Instance<typeof Dish> => {
  const ctx = useContext(DishContext);

  if (ctx === undefined) {
    throw new Error('useSchedule must be used within DishProvider');
  }

  return ctx;
};

const DishProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { id } = useParams();
  const dish = domainStore.dishStore.data.get(id || '');

  return <DishContext.Provider value={dish}>{children}</DishContext.Provider>;
};

export default DishProvider;
