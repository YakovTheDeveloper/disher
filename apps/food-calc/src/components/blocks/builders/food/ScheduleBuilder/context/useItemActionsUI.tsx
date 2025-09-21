import { ItemActions } from '@/components/blocks/builders/food/ScheduleBuilder/types';
import { ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';

// CommonModals | 'time'

type CommonModals = 'food' | 'quantity' | 'nutrients' | 'time';

type CommonVM = {
  children: {
    setCurrentId: (id: number | string) => void;
  };
  deleteChild: (id: number | string) => void;
  recoverDeletedChild: (id: number | string) => void;
};

export function useItemActionsUI<T extends string = never>(
  vm: CommonVM,
  modals: ModalStoreUI<CommonModals | T>
): ItemActions {
  const onTimeOpen = (id: string | number) => {
    vm.children.setCurrentId(id);
    modals.set('time');
  };

  const onFoodsOpenUpdate = (id: string | number) => {
    vm.children.setCurrentId(id);
    modals.set('food');
  };

  const onQuantityOpen = (id: string | number) => {
    vm.children.setCurrentId(id);
    modals.set('quantity');
  };

  const onFoodsOpenInfo = (id: string | number) => {
    vm.children.setCurrentId(id);
    modals.set('nutrients');
  };

  const result = {
    onFoodsOpenUpdate,
    onQuantityOpen,
    onTimeOpen,
    onFoodsOpenInfo,
    onDelete: vm.deleteChild,
    onRecover: vm.recoverDeletedChild,
  };

  return result;
}
