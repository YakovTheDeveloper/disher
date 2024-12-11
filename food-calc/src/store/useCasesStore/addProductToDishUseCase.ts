import { isEmpty } from "@/lib/empty";
import { ProductStore } from "@/store/productStore/productStore";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { IProductBase } from "@/types/dish/dish";
import { makeAutoObservable } from "mobx";

export class AddProductToDishUseCase {
    constructor(
        private rootDishStore: RootDishStore,
        private currentCalculationStore: CalculationReactionStore,
        private productStore: ProductStore
    ) {
        makeAutoObservable(this)
    }

    execute = async (product: IProductBase) => {
        const capturedDish = this.rootDishStore.currentDish

        capturedDish?.toggleProduct({
            ...product,
            quantity: 100
        })

        this.productStore.handleGetFullProductData([product.id])
            .then(res => {
                if (res?.isError) {
                    capturedDish?.toggleProduct({
                        ...product,
                        quantity: 100
                    })
                    return
                }
                this.currentCalculationStore.updateDishCalculationsWithCurrentProducts()
            })
    }
}