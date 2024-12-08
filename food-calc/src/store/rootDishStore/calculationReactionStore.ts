import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { ProductStore } from "@/store/productStore/productStore";
import { RootDayStore } from "@/store/rootDayStore/rootDayStore";
import { DraftDishStore, UserDishStore } from "@/store/rootDishStore/dishStore/dishStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { makeAutoObservable, reaction, toJS } from "mobx";

export class CalculationReactionStore {
    constructor(
        private productStore: ProductStore,
        private calculationStore: CalculationStore,
        private rootDishStore: RootDishStore
    ) {
        makeAutoObservable(this);

        this.initializeReactions();
    }

    private initializeReactions() {
        reaction(
            () => toJS(this.rootDishStore.currentDish?.products),
            (products) => {
                console.log('reaction I: products change')

                if (!products) return;
                this.updateCalculationsWithCurrentProducts();
            }
        );

        reaction(
            () => this.rootDishStore.currentDish,
            (dish) => {
                console.log('reaction II: current dish')
                if (!dish) return;
                this.productStore
                    .handleGetFullProductData(dish.productIds)
                    .then((res) => {
                        if (res?.isError) return;
                        this.updateCalculationsWithCurrentProducts();
                    });
            }
        );
    }

    updateCalculationsWithCurrentProducts() {
        const currentDish = this.rootDishStore.currentDish;
        this.calculationStore.update(currentDish?.products || []);
    }
}
