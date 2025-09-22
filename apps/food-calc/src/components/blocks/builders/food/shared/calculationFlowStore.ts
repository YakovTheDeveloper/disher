import { DayScheduleUI, makeScheduleItemsSignature } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { NutrientsEventEmitter } from "@/components/blocks/builders/food/shared/emitter";
import { EventEmitter } from "@/lib/eventEmitter/eventEmitter";
import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { foodStore } from "@/store/rootStore";
import { getAllFoodIds, getTotalFoodAndDishFoodQuantityFromAll } from "@/store/scheduleStore/schedule.domain";
import { FoodWithQuantity } from "@/store/scheduleStore/schedule.domain.types";
import { makeAutoObservable, comparer, autorun, reaction } from "mobx";

export class CalculationFlowStore {
    products: FoodWithQuantity[] = [];
    private prevSignature: string | null = null;
    content: number[] = [];

    constructor(private vm: {
        schedule: DayScheduleUI
    }, private foodStoreModel: FoodModelStore = foodStore, private emitter: EventEmitter = NutrientsEventEmitter) {
        makeAutoObservable(this);
        this.emitter.on("RECALCULATE_NUTRIENTS", this.onStart);
    }

    setProductsForNutrientCalculations(products: FoodWithQuantity[]) {
        console.log('goint to set', products);
        this.products = products;
    }

    setCurrentScheduleFoodIds(ids: number[]) {
        if (!comparer.shallow(this.content, ids)) {
            this.content = ids;
        }
    }

    onStart = async () => {

        console.log('on calc start');

        const total = getTotalFoodAndDishFoodQuantityFromAll(this.vm.schedule.items);
        const ids = getAllFoodIds(total);
        this.setCurrentScheduleFoodIds(ids);

        const signature = makeScheduleItemsSignature(this.vm.schedule.items);
        console.log('old', this.prevSignature);
        console.log('new', signature);
        console.log('===', this.prevSignature === signature);
        if (signature === this.prevSignature) return

        if (signature !== this.prevSignature) {
            const [_, code] = await this.foodStoreModel.loadFoodWithNutrientsByFoodIds(ids);
            this.setProductsForNutrientCalculations(total);

            if (code === 'NO_FETCH_NEEDED' || code === 'FETCH_DONE') {
                this.setProductsForNutrientCalculations(total);
                return
            }

            if (code === 'FAIL') {
                this.setProductsForNutrientCalculations([]);
                this.prevSignature = '';
                return;
            }
        }
    }

}