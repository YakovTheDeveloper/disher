import { action, autorun, makeAutoObservable, toJS } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct, NutrientIdToQuantityMap } from "../../types/product/product";
import { nutrientStore, productStore } from "@/store/rootStore";
import { getMenuProductIds } from "@/domain/menu";
import { isEmpty } from "@/lib/empty";
import { fetchGetProductWithNutrients } from "@/api/product";
import { DishStore } from "@/store/rootDishStore/dishStore/dishStore";
type Id = string
type ICalculationStore = {
    productsContent: Record<Id, IProduct['content']>
    // addCalculatedProductContent: (id: string, content: IProduct['content']) => void
}

export class CalculationStore implements ICalculationStore {

    productsContent = {

    }

    nutrientStore = nutrientStore
    productStore = productStore

    totalNutrients: NutrientIdToQuantityMap = {}



    setTotal = (nutrients: NutrientIdToQuantityMap) => {
        this.totalNutrients = nutrients
    }

    update(dishes: IProductBase[]) {
        console.log('nutrients dishes',dishes)
        const nutrients = this.calculateNutrients(dishes)
        console.log('nutrients',nutrients)
        this.setTotal(nutrients)
    }

    calculateNutrients = (products: IProductBase[]): NutrientIdToQuantityMap => {
        const totalNutrients: NutrientIdToQuantityMap = {};

        products.forEach(product => {

            const productNutrients = this.productStore.getProductNutrients(+product.id)
            if (!productNutrients) {
                console.log('No nutrients')
                return
            }

            for (const nutrientId in productNutrients) {
                const nutrientValue = productNutrients[nutrientId]
                if (totalNutrients[nutrientId]) {
                    totalNutrients[nutrientId] += product.quantity * nutrientValue / 100;
                } else {
                    totalNutrients[nutrientId] = product.quantity * nutrientValue / 100;
                }
            }




        });

        return totalNutrients;
    };

    resetNutrients = () => this.totalNutrients = {}

    setNutrients = (products: IProductBase[]) => {

    }



    constructor() {

        makeAutoObservable(this)

        autorun(() => {


        })
    }

}
