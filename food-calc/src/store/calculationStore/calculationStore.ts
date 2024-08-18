import { makeAutoObservable } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct, NutrientIdToQuantityMap } from "../../types/product/product";
type Id = string
type ICalculationStore = {
    productsContent: Record<Id, IProduct['content']>
    // addCalculatedProductContent: (id: string, content: IProduct['content']) => void
}

export class CalculationStore implements ICalculationStore {

    productsContent = {

    }

    totalNutrients: NutrientIdToQuantityMap = {
        1: 0,
        2: 0
    }

    // addCalculatedProductContent = (id: string, content: IProduct['content']) => {
    //     this.productsContent[id] = content
    // }

    calculateNutrients = (nutrients: NutrientIdToQuantityMap) => {
        console.log("WWW",nutrients)
        for (const id in nutrients) {
            const quantity = nutrients[id]
            const fixed = Number.parseFloat((this.totalNutrients[id] += quantity).toFixed(2))
            this.totalNutrients[id] = fixed
        }

        this.totalNutrients
    }

    constructor() {
        makeAutoObservable(this)
    }

}
