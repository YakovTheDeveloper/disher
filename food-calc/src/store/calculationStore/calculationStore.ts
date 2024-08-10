import { makeAutoObservable } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct } from "../../types/product/product";
type Id = string
type ICalculationStore = {
    productsContent: Record<Id, IProduct['content']>
    addCalculatedProductContent: (id: string, content: IProduct['content']) => void
}

export class CalculationStore implements ICalculationStore {

    productsContent = {

    }

    totalNutrients = {
        main: {
            carb: 0,
            fat: 0,
            protein: 0
        }
    }

    addCalculatedProductContent = (id: string, content: IProduct['content']) => {
        this.productsContent[id] = content
    }

    calculateNutrients = (content: IProduct['content']) => {

        for (const category in content) {
            const nutrients = content[category]
            for (const nutrient in nutrients) {
                const value = nutrients[nutrient]
                const fixed = Number.parseFloat((this.totalNutrients[category][nutrient] += value).toFixed(2))
                this.totalNutrients[category][nutrient] = fixed
            }

        }

        this.totalNutrients
    }

    constructor() {
        makeAutoObservable(this)
    }

}
