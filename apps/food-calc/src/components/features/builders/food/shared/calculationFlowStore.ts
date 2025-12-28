import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { foodStore } from "@/store/rootStore";
import { getAllFoodIds } from "@/store/models/schedule/schedule.domain";
import { FoodWithQuantity } from "@/store/models/schedule/schedule.domain.types";
import { makeAutoObservable, comparer } from "mobx";

export class PrepareProductsForCalculationStore {
    products: FoodWithQuantity[] = [];
    private prevSignature: string | null = null;
    content: number[] = [];

    constructor(private foodStoreModel: FoodModelStore = foodStore) {
        makeAutoObservable(this);
    }

    updateProducts(products: FoodWithQuantity[]) {
        console.log('going to set', products);
        this.products = products;
    }

    setCurrentScheduleFoodIds(ids: number[]) {
        if (!comparer.shallow(this.content, ids)) {
            this.content = ids;
        }
    }

    onStart = async (total: FoodWithQuantity[], signature?: string | null) => {
        const ids = getAllFoodIds(total);
        this.setCurrentScheduleFoodIds(ids);

        if (signature && signature === this.prevSignature) {
            console.log('No changes detected, skipping...');
            return;
        }

        console.log('Signature changed or not provided:', {
            prev: this.prevSignature,
            next: signature,
        });

        const [_, code] = await this.foodStoreModel.loadFoodWithNutrientsByFoodIds(ids);
        this.updateProducts(total);

        if (code === 'NO_FETCH_NEEDED' || code === 'FETCH_DONE') {
            this.updateProducts(total);
            this.prevSignature = signature ?? null;
            return;
        }

        if (code === 'FAIL') {
            this.updateProducts([]);
            this.prevSignature = '';
            return;
        }
    };
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