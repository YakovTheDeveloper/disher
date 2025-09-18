import { DishBuilderModals } from "@/components/blocks/builders/food/DishBuilder";
import { DishBuilderViewModel } from "@/components/blocks/builders/food/DishBuilder/model/DishBuilderViewModel";
import { ScheduleBuilderModals } from "@/components/blocks/builders/food/ScheduleBuilder";
import { ScheduleBuilderViewModel } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { Modals } from "@/components/blocks/builders/food/ScheduleBuilder/ScheduleBuilder";
import { ModalStoreUI } from "@/components/blocks/builders/food/shared/ModalStoreUI";
import { scheduleStore } from "@/store/rootStore";
import { createContext, useCallback, useContext } from "react";

export type CommonModals =
    | 'food'
    | 'quantity'
    | 'nutrients'

const useDishItemActionsUI = (vm: DishBuilderViewModel, modals: ModalStoreUI<CommonModals>) => {
    const onFoodsOpenCreate = () => {
        vm.children.setCurrentId(-1);
        modals.set('food');
    };

    const onFoodsOpenUpdate = useCallback((id: string | number) => {
        vm.children.setCurrentId(id);
        modals.set('food');
    }, []);

    const onQuantityOpen = (id: string | number) => {
        vm.children.setCurrentId(id);
        modals.set('quantity');
    };

    return {
        onFoodsOpenCreate,
        onFoodsOpenUpdate,
        onQuantityOpen
    }
}
