import { RootDayStore } from "@/store/rootDayStore/rootDayStore"
import { ProductStore } from "@/store/productStore/productStore"
import { RootDishStore } from "@/store/rootDishStore/rootDishStore"
import { makeAutoObservable, reaction, toJS } from "mobx"

export class GetFullDataStore {

    rootDayStore: RootDayStore | null = null
    productStore: ProductStore | null = null
    rootDishStore: RootDishStore | null = null

    isProductNutrientsLoading: {
        day: Record<string, boolean>,
        dish: Record<string, boolean>
    } = {
            day: {},
            dish: {}
        }

    constructor(
        rootDayStore: RootDayStore,
        productStore: ProductStore,
        rootDishStore: RootDishStore
    ) {
        makeAutoObservable(this)
        this.rootDayStore = rootDayStore
        this.productStore = productStore
        this.rootDishStore = rootDishStore


        // reaction(
        //     () => [rootDayStore.currentDayId],
        //     ([currentDayId]) => {
        //         this.isProductNutrientsLoading.day[currentDayId] = true
        //         const res = this.getProductNutrientData()
        //             .then(res => console.log(currentDayId, toJS(res)))
        //             .finally(() => setTimeout(() => this.isProductNutrientsLoading.day[currentDayId] = false, 500))
        //         // console.log("currentDayId", currentDayId, res)
        //     }
        // );

    }

    // getProductNutrientData = async () => {
    //     const dishIds = this.rootDayStore?.currentStore?.products
    //     const dishProductData = this.rootDishStore?.getDishesProductsAsIds(dishIds)
    //     const productIdsToFetch = this.productStore?.getMissingProductIds(dishProductData)
    //     const result = await this.productStore?.fetchProductWithNutrients(productIdsToFetch)
    //     return result
    // }


}