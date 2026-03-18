import { ModalStoreUI } from '@/components/features/builders/shared/ModalStoreUI';

type CommonModals = 'food' | 'quantity' | 'foodNutrients';

type CommonVM = {
    children: {
        setCurrentId: (id: number | string) => void;
        deleteChild: (id: number | string) => void;
        recoverDeletedChild: (id: number | string) => void;
    };
};

type Args = {
    variant: 'schedule',
    vm: CommonVM,
    modals: ModalStoreUI<CommonModals | 'createDish' | 'time' | 'dishNutrients'>
} | {
    variant: 'dish',
    vm: CommonVM,
    modals: ModalStoreUI<CommonModals>
}

export type ItemActions = {
    onFoodsOpenUpdate: (id: string | number) => void;
    onFoodsOpenInfo: (id: string | number) => void;
    onDishOpenInfo?: (id: string | number) => void;
    onTimeOpen?: (id: string | number) => void;
    onQuantityOpen: (id: string | number) => void;
    onDelete: (childId: string | number) => void;
    onRecover: (childId: string | number) => void;
}

export function useItemActionsUI({ modals, variant, vm }: Args): ItemActions {
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
        modals.set('foodNutrients');
    };

    const result = {
        onFoodsOpenUpdate,
        onQuantityOpen,
        onFoodsOpenInfo,
        onDelete: vm.children.deleteChild,
        onRecover: vm.children.recoverDeletedChild,
        ...(variant === 'schedule' ? {
            onTimeOpen: (id: string | number) => {
                vm.children.setCurrentId(id)
                modals.set('time');
            }
        } : {}),
        ...(variant === 'schedule' ? {
            onDishOpenInfo: (id: string | number) => {
                vm.children.setCurrentId(id)
                modals.set('dishNutrients');
            }
        } : {}),
    };

    return result;
}
