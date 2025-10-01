import { autorun, makeAutoObservable, runInAction } from "mobx";
import { PrepareProductsForCalculationStore } from "@/components/blocks/builders/food/shared/calculationFlowStore";
import { getTotalFoodAndDishFoodQuantityFromAll } from "@/store/models/schedule/schedule.domain";

type DishItem = {
    food: {
        id: number;
        name: string;
    };
    quantity: number;
};

type Dish = {
    id: number;
    name: string;
    items: DishItem[];
};

type CurrentDish = {
    dish: Dish;
    id: number | string;
    quantity: number;
    time: string;
};

export class DishNutrientsViewModel {
    currentFoodId: number | null = null;

    mainPrepareStore: PrepareProductsForCalculationStore;

    itemPrepareStores: Map<number, PrepareProductsForCalculationStore> = new Map();

    constructor(private currentDish: CurrentDish) {
        makeAutoObservable(this, {}, { autoBind: true });

        this.mainPrepareStore = new PrepareProductsForCalculationStore();
        const total = getTotalFoodAndDishFoodQuantityFromAll(this.currentDish.dish.items);
        this.mainPrepareStore.onStart(total, "");

        this.initializeItemStores();

        autorun(() => {
            const id = this.currentFoodId;
            if (!id) return;

            const item = this.currentDish.dish.items.find((i) => i.food.id === id);
            if (!item) return;

            const store = this.itemPrepareStores.get(id);
            if (!store) return;

            console.log("item", item);

            const total = getTotalFoodAndDishFoodQuantityFromAll([item]);
            store.onStart(total, "");
        });
    }

    private initializeItemStores() {
        this.currentDish.dish.items.forEach((item) => {
            const store = new PrepareProductsForCalculationStore();
            this.itemPrepareStores.set(item.food.id, store);
        });
    }

    setCurrentFoodId(foodId: number | null) {
        runInAction(() => {
            this.currentFoodId = foodId;
        });
    }

    get currentFood() {
        return this.currentDish.dish.items.find((item) => item.food.id === this.currentFoodId);
    }

    get foodContent() {
        return this.currentDish.dish.items;
    }

    get prepareStore(): PrepareProductsForCalculationStore {
        if (!this.currentFoodId) return this.mainPrepareStore;
        return this.itemPrepareStores.get(this.currentFoodId) || this.mainPrepareStore;
    }

    get dishName() {
        return this.currentDish.dish.name
    }
}
