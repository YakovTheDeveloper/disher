import { action, makeAutoObservable, toJS } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProducts, ProductBase, ProductIdToNutrientsMap, RichProductData } from "../../types/product/product";
import { fetchGetProductWithNutrients, fetchGetRichNutrientProducts } from "@/api/product";
import { isEmpty } from "@/lib/empty";
import { LoadingStateStore } from "@/store/common/LoadingStateStore";
import { initProducts } from "@/store/productStore/initProducts";
import { NutrientName } from "@/types/nutrient/nutrient";
import { IdToQuantity } from "@/types/common/common";

type IProductStore = {

}


export type RichProducts = Record<NutrientName, RichProductData[] | null>

export class ProductStore implements IProductStore {

    constructor() {
        makeAutoObservable(this)
    }

    productsBase: ProductBase[] = structuredClone(initProducts)

    productToNutrients: ProductIdToNutrientsMap = {}

    loadingState = new LoadingStateStore()

    richProductsLoadingState = new LoadingStateStore()

    richNutrientProducts: RichProducts = {
        protein: null,
        fats: null,
        carbohydrates: null,
        sugar: null,
        starch: null,
        fiber: null,
        energy: null,
        water: null,
        iron: null,
        magnesium: null,
        calcium: null,
        phosphorus: null,
        potassium: null,
        sodium: null,
        zinc: null,
        copper: null,
        manganese: null,
        selenium: null,
        iodine: null,
        vitaminA: null,
        vitaminB1: null,
        vitaminB2: null,
        vitaminB3: null,
        vitaminB4: null,
        vitaminB5: null,
        vitaminB6: null,
        vitaminB7: null,
        vitaminB9: null,
        vitaminB12: null,
        vitaminC: null,
        vitaminD: null,
        vitaminE: null,
        vitaminK: null,
        betaCarotene: null,
        alphaCarotene: null,
    }

    setProductsBase = (products: ProductBase[]) => {
        this.productsBase = products
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

    handleGetAllRichNutrientProducts = async (nutrientName: NutrientName) => {
        const exist = this.richNutrientProducts[nutrientName]
        if (exist) return

        this.richProductsLoadingState.setLoading('getOne', true, nutrientName)
        fetchGetRichNutrientProducts(nutrientName).then(res => {
            if (res.isError) {
                this.richProductsLoadingState.setLoading('getOne', false, nutrientName)
                return res
            }
            this.setRichNutrientProduct(nutrientName, res.data)
            this.richProductsLoadingState.setLoading('getOne', false, nutrientName)
        })
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

    setRichNutrientProduct = (nutrient: NutrientName, products: RichProductData[]) => {
        this.richNutrientProducts[nutrient] = products
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