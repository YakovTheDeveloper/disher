import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { ProductStore } from "@/store/productStore/productStore";
import { RootDayStore2 } from "@/store/rootDayStore/rootDayStore2";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { makeAutoObservable, reaction, toJS } from "mobx";

type StoreParameters = {
    productStore: ProductStore,
    rootDishStore: RootDishStore,
    rootDayStore: RootDayStore2,
    calculationStore: CalculationStore,
}

export class CalculationReactionStore {
    constructor(
        private productStore: ProductStore,
        private rootDishStore: RootDishStore,
        private rootDayStore: RootDayStore2,
        private calculationDishStore: CalculationStore,
        private calculationDayStore: CalculationStore,
    ) {
        makeAutoObservable(this);

        this.initializeReactions();
    }

    private initializeReactions() {
        reaction(
            () => toJS(this.rootDishStore.currentStore?.products),
            (products) => {
                console.log('reaction I: products change')
                products && this.updateDishCalculationsWithCurrentProducts();
            }
        );

        const fetchProductsAndUpdateDishCalculations = reaction(
            () => this.rootDishStore.currentStore,
            (dish) => {
                console.log('reaction II: current dish')
                if (!dish) return;
                this.productStore
                    .handleGetFullProductData(dish.productIds)
                    .then((res) => {
                        if (res?.isError) return;
                        this.updateDishCalculationsWithCurrentProducts();
                    });
            }
        );

        // reaction(
        //     () => this.rootDayStore.currentStore?.calcReactionPayload,
        //     (products) => {
        //         console.log('reaction I: day change')
        //         products && this.updateDayCalculationsWithCurrentProducts();
        //     }
        // );

        const fetchProductsAndUpdateDayCalculations = reaction(
            () => this.rootDayStore.currentStore,
            (day) => {
                if (!day) return
                console.log('reaction II: current day')

                this.productStore
                    .handleGetFullProductData(day.uniqueProductIds)
                    .then((res) => {
                        // if (res?.isError) return;
                        this.updateDayCalculationsWithCurrentProducts();
                    });
            }
        );


        // const fetchProductsAndUpdateDayCalculations2 = reaction(
        //     () => toJS(this.rootDayStore.currentStore?.categories.map(category => category.dishes.map(({ products }) => products.length))),
        //     (day) => {
        //         if (!day) return
        //         console.log('reaction II: current day')
        //         if (!this.rootDayStore.currentStore?.uniqueProductIds) return
        //         this.productStore
        //             .handleGetFullProductData(this.rootDayStore.currentStore?.uniqueProductIds)
        //             .then((res) => {
        //                 if (res?.isError) return;
        //                 this.updateDayCalculationsWithCurrentProducts();
        //             });
        //     }
        // );


        // const fetchProductsAndUpdateDayCalculations3 = reaction(
        //     () => toJS(this.rootDayStore.currentStore?.categories.map(({ dishes }) => dishes.map(({ quantity }) => quantity))),
        //     (day) => {
        //         if (!day) return
        //         console.log('reaction II: current day COEFF')
        //         if (!this.rootDayStore.currentStore?.uniqueProductIds) return
        //         this.updateDayCalculationsWithCurrentProducts();
        //     }
        // );
    }

    updateDishCalculationsWithCurrentProducts = () => {
        const currentDish = this.rootDishStore.currentStore;
        this.calculationDishStore.update(currentDish?.products || []);
    }

    updateDayCalculationsWithCurrentProducts = () => {
        const currentDish = this.rootDayStore.currentStore;
        if (!currentDish) return
        this.calculationDayStore.updateWithDay(currentDish.categories);
    }
}
