import { DayScheduleUI, makeScheduleItemsSignature } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { NutrientsEventEmitter } from "@/components/blocks/builders/food/shared/emitter";
import { EventEmitter } from "@/lib/eventEmitter/eventEmitter";
import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { foodStore } from "@/store/rootStore";
import { getAllFoodIds, getTotalFoodAndDishFoodQuantityFromAll } from "@/store/scheduleStore/schedule.domain";
import { FoodWithQuantity } from "@/store/scheduleStore/schedule.domain.types";
import { makeAutoObservable, comparer, autorun, reaction } from "mobx";

export class PrepareProductsForCalculationStore {
    products: FoodWithQuantity[] = [];
    private prevSignature: string | null = null;
    content: number[] = [];

    constructor(private foodStoreModel: FoodModelStore = foodStore) {
        makeAutoObservable(this);
    }

    updateProducts(products: FoodWithQuantity[]) {
        console.log('goint to set', products);
        this.products = products;
    }

    setCurrentScheduleFoodIds(ids: number[]) {
        if (!comparer.shallow(this.content, ids)) {
            this.content = ids;
        }
    }

    onStart = async (total: FoodWithQuantity[], signature: string) => {
        const ids = getAllFoodIds(total);
        this.setCurrentScheduleFoodIds(ids);

        console.log('old', this.prevSignature);
        console.log('new', signature);
        console.log('===', this.prevSignature === signature);
        if (signature === this.prevSignature) return

        if (signature !== this.prevSignature) {
            const [_, code] = await this.foodStoreModel.loadFoodWithNutrientsByFoodIds(ids);
            this.updateProducts(total);

            if (code === 'NO_FETCH_NEEDED' || code === 'FETCH_DONE') {
                this.updateProducts(total);
                return
            }

            if (code === 'FAIL') {
                this.updateProducts([]);
                this.prevSignature = '';
                return;
            }
        }
    }

}
// export class PrepareProductsForCalculationStore {
//     products: FoodWithQuantity[] = [];
//     private prevSignature: string | null = null;
//     content: number[] = [];

//     constructor(private vm: {
//         schedule: DayScheduleUI
//     }, private foodStoreModel: FoodModelStore = foodStore, private emitter: EventEmitter = NutrientsEventEmitter) {
//         makeAutoObservable(this);
//         this.emitter.on("RECALCULATE_NUTRIENTS", this.onStart);
//     }

//     updateProducts(products: FoodWithQuantity[]) {
//         console.log('goint to set', products);
//         this.products = products;
//     }

//     setCurrentScheduleFoodIds(ids: number[]) {
//         if (!comparer.shallow(this.content, ids)) {
//             this.content = ids;
//         }
//     }

//     private createSignature

//     onStart = async (data: FoodWithQuantity[], createSignature: () => string) => {

//         console.log('on calc start');

//         const total = getTotalFoodAndDishFoodQuantityFromAll(this.vm.schedule.items);
//         const ids = getAllFoodIds(total);
//         this.setCurrentScheduleFoodIds(ids);

//         const signature = makeScheduleItemsSignature(this.vm.schedule.items);
//         // console.log('old', this.prevSignature);
//         // console.log('new', signature);
//         // console.log('===', this.prevSignature === signature);
//         if (signature === this.prevSignature) return

//         if (signature !== this.prevSignature) {
//             const [_, code] = await this.foodStoreModel.loadFoodWithNutrientsByFoodIds(ids);
//             this.updateProducts(total);

//             if (code === 'NO_FETCH_NEEDED' || code === 'FETCH_DONE') {
//                 this.updateProducts(total);
//                 return
//             }

//             if (code === 'FAIL') {
//                 this.updateProducts([]);
//                 this.prevSignature = '';
//                 return;
//             }
//         }
//     }

// }