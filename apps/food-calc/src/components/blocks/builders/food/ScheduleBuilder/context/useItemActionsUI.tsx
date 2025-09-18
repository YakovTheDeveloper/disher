import { ScheduleBuilderModals } from '@/components/blocks/builders/food/ScheduleBuilder';
import { ScheduleBuilderViewModel } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { ItemActions } from '@/components/blocks/builders/food/ScheduleBuilder/types';
import { CommonModals, ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import { useCallback } from 'react';
import { createContext, useContext } from 'react';

export const useScheduleItemActionsUI = (
  vm: ScheduleBuilderViewModel,
  modals: ModalStoreUI<CommonModals | 'time'>
): ItemActions => {
  const onTimeOpen = (id: string | number) => {
    vm.children.setCurrentId(id);
    modals.set('time');
  };

  const onFoodsOpenUpdate = useCallback((id: string | number) => {
    vm.children.setCurrentId(id);
    modals.set('food');
  }, []);

  const onQuantityOpen = (id: string | number) => {
    vm.children.setCurrentId(id);
    modals.set('quantity');
  };

  const onFoodsOpenInfo = (id: string | number) => {
    vm.children.setCurrentId(id);
    // if (!schedule.children.current) return;
    // const food = getTotalFoodAndDishFoodQuantityFromOne(schedule.children.current);
    // const ids = getAllFoodIds(food);
    // foodStore.loadFoodWithNutrientsByFoodIds(ids);
    modals.set('nutrients');
  };

  return {
    onFoodsOpenUpdate,
    onQuantityOpen,
    onTimeOpen,
    onFoodsOpenInfo,
    onDelete: vm.deleteChild,
    onRecover: vm.recoverDeletedChild,
  };
};
