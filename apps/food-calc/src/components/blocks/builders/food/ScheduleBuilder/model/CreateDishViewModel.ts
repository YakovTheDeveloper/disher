import { addDish } from "@/api/dish/dish.api";
import { DishBuilderViewModel } from "@/components/blocks/builders/food/DishBuilder/model/DishBuilderViewModel";
import { ScheduleBuilderViewModel, TimeGroupUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { createFoodQuantityCollectionDTO } from "@/components/blocks/builders/food/shared/dto";
import { getTotalDishFoodContentQuantity } from "@/store/models/dish/dish.domain";
import { DishModelStore } from "@/store/models/dish/dishStore";

import { makeAutoObservable } from "mobx";

export class DishCreatingStore {
    time: string = "";
    vm: DishBuilderViewModel | null = null;

    constructor(
        private dishStore: DishModelStore,
        private schedule: ScheduleBuilderViewModel
    ) {
        makeAutoObservable(this)
    }

    setVm = (vm: DishBuilderViewModel | null) => {
        this.vm = vm;
    }

    setTime = (time: string) => {
        this.time = time;
    }

    create = (group: TimeGroupUI) => {
        const { time, items } = group;
        const dto = createFoodQuantityCollectionDTO(items)
        this.setVm(new DishBuilderViewModel(dto))
        this.time = time;
    }

    onFinish = async () => {
        if (!this.vm) return;
        const dish = await addDish(this.vm.payload());
        if (!dish) return;
        this.dishStore.set(dish.id, dish);
        const initQuantity = getTotalDishFoodContentQuantity(dish.items)
        this.schedule.addChild({ dish, food: null, time: this.time, quantity: initQuantity }, false);
        this.schedule.removeChildrenByFoodIdsAndTime(
            this.vm.content.items.map(({ food }) => food.id),
            this.time
        );
        this.setVm(null);
    }
}

export default DishCreatingStore;