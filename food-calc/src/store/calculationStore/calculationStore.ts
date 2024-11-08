import { action, autorun, makeAutoObservable, toJS } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct, NutrientIdToQuantityMap } from "../../types/product/product";
import { nutrientStore, productStore } from "@/store/rootStore";
import { getMenuProductIds } from "@/domain/menu";
import { isEmpty } from "@/lib/empty";
import { fetchGetProductWithNutrients } from "@/api/product";
import { MenuStore } from "@/store/rootMenuStore/menuStore/menuStore";
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

    calculateNutrients = (products: IProductBase[]): NutrientIdToQuantityMap => {
        const totalNutrients: NutrientIdToQuantityMap = {};

        products.forEach(product => {

            const productNutrients = this.productStore.getProductNutrients(+product.id)
            console.log('productNutrients', productNutrients)
            if (!productNutrients) return

            for (const nutrientId in productNutrients) {
                const nutrientValue = productNutrients[nutrientId]
                console.log('nutrientValue', nutrientValue)
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
        // this.totalNutrients =
    }

    // fetchMissedProductNutrients(menu: IMenu) {

    //     const { setProductNutrientData, getMissingProductIds } = productStore

    //     const productIdsInMenu = getMenuProductIds(menu)
    //     const missingProducts = getMissingProductIds(productIdsInMenu)

    //     console.log('productIdsInMenu', productIdsInMenu)
    //     console.log('missingProducts', missingProducts)

    //     if (isEmpty(missingProducts)) return

    //     fetchGetProductWithNutrients(missingProducts).then(
    //         action("fetchSuccess", res => {
    //             res && setProductNutrientData(res)

    //             // add to totalNutrients
    //         }),
    //         action("fetchError", error => {
    //         })
    //     )
    // }

    menuStore: MenuStore;

    // get menuProducts() {
    //     return this.menuStore.products
    // }

    constructor(menuStore: MenuStore) {
        this.menuStore = menuStore
        makeAutoObservable(this)

        autorun(() => {
            // console.log("wtf00000000000")
            // console.log("__________ WTF", toJS(this.menuStore.products))
            // const calculated = this.calculateNutrients(this.menuStore.products)
            // this.totalNutrients = calculated
            // console.log("wtf__", toJS(calculated))
        })
    }

}
