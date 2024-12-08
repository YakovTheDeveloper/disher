import { action, makeAutoObservable, toJS } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProducts, ProductBase, ProductIdToNutrientsMap } from "../../types/product/product";
import { fetchGetProductWithNutrients } from "@/api/product";
import { isEmpty } from "@/lib/empty";
import { LoadingStateStore } from "@/store/common/LoadingStateStore";

type IProductStore = {

}

export class ProductStore implements IProductStore {

    constructor() {
        makeAutoObservable(this)
    }

    productsBase: ProductBase[] = []

    productToNutrients: ProductIdToNutrientsMap = {}

    loadingState = new LoadingStateStore()

    setProductsBase = (products: ProductBase[]) => {
        this.productsBase = products
        console.log('this.productsBase', toJS(this.productsBase))
    }

    handleGetFullProductData = async (ids: number[]) => {
        const missingProductIds = this.getMissingProductIds(ids)
        if (isEmpty(missingProductIds)) return
        return this.fetchFullProductData(missingProductIds)
    }

    fetchFullProductData = async (ids: number[]) => {
        ids.forEach(id => this.loadingState.setLoading('getOne', true, id))
        const res = await fetchGetProductWithNutrients(ids)

        if (res.isError) {
            ids.forEach(id => this.loadingState.setLoading('getOne', false, id))
            return res
        }

        ids.forEach(id => this.loadingState.setLoading('getOne', false, id))
        this.setProductNutrientData(res.data)
        return res
    }


    setProductNutrientData = (data: ProductIdToNutrientsMap) => {
        for (const id in data) {
            const nutrientToQuantity = data[id]
            this.productToNutrients[id] = nutrientToQuantity
        }
    }

    getMissingProductIds = (dishProductIds: number[]): number[] => {
        return dishProductIds.filter(id => !(id in this.productToNutrients));
    }

    getProductNutrients = (productId: number) => {
        return this.productToNutrients[productId]
    }

}

// fetchAndSetProductNutrientsData = async (ids: number[], signal?: AbortSignal) => {
//     const missingProducts = this.getMissingProductIds(ids)

//     if (isEmpty(missingProducts)) return

//     return fetchGetProductWithNutrients(missingProducts, {
//         signal
//     }).then(
//         action("fetchSuccess", res => {
//             this.setProductNutrientData(res)
//             return res
//         }),
//         action("fetchError", error => {
//             console.error(error)
//             return error
//         })
//     )
//         .catch(err => err)
// }