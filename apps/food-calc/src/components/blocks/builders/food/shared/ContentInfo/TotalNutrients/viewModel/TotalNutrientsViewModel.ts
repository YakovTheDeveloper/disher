import { DayScheduleUI, makeScheduleItemsSignature } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { PrepareProductsForCalculationStore } from "@/components/blocks/builders/food/shared/calculationFlowStore";
import { NutrientsEventEmitter } from "@/components/blocks/builders/food/shared/emitter";
import { getTotalFoodAndDishFoodQuantityFromAll, getTotalFoodAndDishFoodQuantityFromSchedule } from "@/store/scheduleStore/schedule.domain";
import { makeAutoObservable } from "mobx";
import { EventEmitter } from "stream";

export class TotalNutrientsViewModel {

    constructor(private vm: {
        schedule: DayScheduleUI
    }, private preparationStore: PrepareProductsForCalculationStore, private emitter: EventEmitter = NutrientsEventEmitter) {

        this.emitter.on("RECALCULATE_NUTRIENTS", () => {
            console.info('Emit: RECALCULATE_NUTRIENTS');
            const total = getTotalFoodAndDishFoodQuantityFromAll(vm.schedule.items)
            const signature = makeScheduleItemsSignature(this.vm.schedule.items)
            console.log('total', total);
            this.preparationStore.onStart(total, signature)
        });
        makeAutoObservable(this);
    }

}