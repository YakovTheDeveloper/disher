import { makeAutoObservable } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProducts, ProductBase, ProductIdToNutrientsMap } from "../../types/product/product";

type IProductStore = {

}

export class ProductStore implements IProductStore {


    productsBase: ProductBase[] = []

    setProductsBase = (products: ProductBase[]) => {
        console.log("ssssss", products)
        this.productsBase = products
    }






    productToNutrients: ProductIdToNutrientsMap = {}

    setProductNutrientData = (data: ProductIdToNutrientsMap) => {
        for (const id in data) {
            const nutrientToQuantity = data[id]
            this.productToNutrients[id] = nutrientToQuantity
        }
    }

    getMissingProductIds = (menuProductIds: number[]): number[] => {
        const existingProductIds = Object.keys(this.productToNutrients).map(id => Number(id));
        const missingProductIds = menuProductIds.filter(id => !existingProductIds.includes(id));
        return missingProductIds;
    }

    getProductNutrients = (productId: number) => {
        return this.productToNutrients[productId]
    }


    products: IProducts = {
        1: {
            id: "1",
            name: 'Apples',
            content: {
                main: {
                    carb: 50,
                    fat: 0,
                    protein: 1
                }
            }
        },
        2: {
            id: "2",
            name: 'Oranges',
            content: {
                main: {
                    carb: 25,
                    fat: 0,
                    protein: 1
                }
            }
        }
    }



    constructor() {
        makeAutoObservable(this)
    }




}
