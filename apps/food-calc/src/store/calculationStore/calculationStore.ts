import { autorun, makeAutoObservable, reaction } from "mobx"

import { NutrientIdToQuantityMap } from "../../types/product/product";
import { nutrientStore, productStore } from "@/store/rootStore";
import { DayCategory } from "@/types/day/day";
import { RootDailyNormStore } from "@/store/dailyNormStore/dailyNormStore";
import { DailyNorm } from "@/types/norm/norm";
//@ts-ignore
import { IProduct } from "@/types/menu/Menu";
import { IProductBase } from "@/types/dish/dish";
import { NutrientStore } from "@/store/nutrientStore/nutrientStore";
import { ProductStore } from "@/store/productStore/productStore";
import { RootProductStore } from "@/store/productStore/rootProductStore";



export class CalculationStore {
    totalNutrients: NutrientIdToQuantityMap = {}

    constructor(private rootProductStore: RootProductStore, private productStore: ProductStore) {
        makeAutoObservable(this)
    }

    setTotal = (nutrients: NutrientIdToQuantityMap) => {
        this.totalNutrients = nutrients
    }

    update(products: IProduct[]) {
        console.log("products", products)
        const nutrients = this.calculateNutrients(products)
        console.log("products nutrients", nutrients)
        this.setTotal(nutrients)
    }

    updateWithDay = (categories: DayCategory[]) => {
        this.setTotal(this.getCalculatedDay(categories))
    }

    getCalculatedDay = (categories: DayCategory[]): NutrientIdToQuantityMap => {
        const totalNutrients: NutrientIdToQuantityMap = {};

        const categoriesNutrients = categories.map(category => {

            const dishesNutrients: NutrientIdToQuantityMap[] = category.dishes.map(dish => {
                return this.calculateNutrients(dish.products, dish.quantity)
            })
            return dishesNutrients
        })

        categoriesNutrients.forEach(categoryNutrients => {
            categoryNutrients.forEach(dishNutrients => {
                for (const [nutrientId, quantity] of Object.entries(dishNutrients)) {
                    if (totalNutrients[+nutrientId]) {
                        totalNutrients[+nutrientId] += quantity;
                    } else {
                        totalNutrients[+nutrientId] = quantity;
                    }
                }
            });
        });

        return totalNutrients
    }

    calculateNutrients = (products: IProduct[], dishQuantity?: number): NutrientIdToQuantityMap => {
        const totalNutrients: NutrientIdToQuantityMap = {};

        products.forEach(product => {

            const productNutrients = this.rootProductStore.userStoresMap[product.id].nutrients

            // const productNutrients = this.productStore.getProductNutrients(+product.id)
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

        if (dishQuantity != null) {
            for (const nutrientId in totalNutrients) {
                const value = totalNutrients[nutrientId]
                totalNutrients[nutrientId] = value * dishQuantity / 100
            }
        }

        return totalNutrients;
    };

    resetNutrients = () => this.totalNutrients = {}

    setNutrients = (products: IProductBase[]) => {

    }


}
