import { action, autorun, makeAutoObservable, reaction, toJS } from "mobx"
import { IMenu, IProductBase, IProductWithNutrients } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct } from "../../types/product/product";
import { DraftDishStore, DishStore, UserDishStore } from "@/store/rootDishStore/dishStore/dishStore";
import { fetchCreateMenu, fetchDeleteMenu, fetchGetAllMenu, fetchGetMenu, FoodCollection } from "@/api/menu";
import { MenuPayload } from "@/types/api/menu";
import { ProductStore } from "@/store/productStore/productStore";
import { emitter, EVENTS } from "@/store/emitter";
import { NutrientStore } from "@/store/nutrientStore/nutrientStore";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { isEmpty, isNotEmpty } from "@/lib/empty";

type IRootMenuStore = {
    setCurrentMenuId(id: number): void
    productStore: ProductStore
}

export const DRAFT_MENU_ID = 'draft-menu'

export class RootDishStore implements IRootMenuStore {

    draftDish = new DraftDishStore().setData({
        id: DRAFT_MENU_ID,
        name: 'Новое блюдо'
    })

    userDishes: DishStore[] = []

    currentDishId: number | 'draft-menu' = DRAFT_MENU_ID

    get dishes() {
        return [this.draftDish, ...this.userDishes]
    }

    get currentDish() {
        return this.dishes.find(({ id }) => id === this.currentDishId)
    }


    getDishesProductsAsIds = (dishIds: string[]) => {
        const ids: Record<string, boolean> = {}
        this.dishes
            .filter(({ id }) => dishIds.includes(id))
            .forEach(({ products }) => products.forEach(({ id }) => ids[id] = true))
        return Object.keys(ids)
    }

    get idToDishMapping() {
        return this.dishes.reduce((acc, dish) => {
            acc[dish.id] = dish.products
            return acc
        }, {} as Record<string, IProductBase[]>)
    }

    getCorrespondingDishes = (dishIds: string[]): IProductBase[] => {
        return dishIds.flatMap(dishId => this.idToDishMapping[dishId])
    }

    getCorrespondingDishesProductsIds = (dishIds: string[]) => {
        return Array.from(new Set(dishIds.flatMap(dishId => this.idToDishMapping[dishId].map(({ id }) => id))))
    }

    setCurrentMenuId = (id: number | 'draft-menu') => {
        this.currentDishId = id
    }

    getAll = async () => {
        fetchGetAllMenu().then(
            action("fetchSuccess", res => {

                res.forEach(({ description, id, name, products }) => {
                    const store = new UserDishStore(this)
                    store.description = description
                    store.id = id
                    store.name = name
                    store.products = products
                    store.setInitProductsSnapshot(products)
                    this.userDishes.push(store)
                })
            }),
            action("fetchError", error => {
            })
        )
    }

    getOne = async (id: number): Promise<{
        products: IProductWithNutrients[];
        dishIds: number[];
    }> => {
        return fetchGetMenu(id).then(
            action("fetchSuccess", res => res.result),
            action("fetchError", error => {
            })
        )
    }

    removeDish = async (id: string): Promise<any> => {
        return fetchDeleteMenu(id).then(
            action("fetchSuccess", res => {
                this.userDishes = this.userDishes.filter(dish => dish.id !== id)
            }),
            action("fetchError", error => {
            })
        )
    }

    currentAbortController: AbortController | null = null;

    constructor(private productStore: ProductStore, private calculationStore: CalculationStore) {
        makeAutoObservable(this)

        autorun(() => {

            this.getAll()
        })

        reaction(
            () => [this.currentDish],
            ([dish]) => {
                if (!dish) return
                if (this.currentAbortController) {
                    this.currentAbortController.abort();
                }
                console.log("reaction 1, update")
                this.currentAbortController = new AbortController();
                this.calculationStore.resetNutrients()

                const productIds = dish.productIds
                const productsToFetch = this.calculationStore.productStore.getMissingProductIds(productIds)
                const currentProducts = dish.products

                if (isNotEmpty(productsToFetch)) {
                    const currentController = this.currentAbortController
                    this.calculationStore.productStore.fetchAndSetProductNutrientsData(productsToFetch, this.currentAbortController.signal)
                        .then(res => {
                            if (!res) return
                            if (currentController !== this.currentAbortController) return;
                            this.calculationStore.update(currentProducts)
                        })

                }
                if (isEmpty(productsToFetch)) {
                    this.calculationStore.update(currentProducts)
                }
            })

        reaction(
            () => [this.currentDish?.products.map(product => toJS(product))],
            ([products]) => {
                if (!products) return
                console.log("reaction 2, update")
                this.calculationStore.update(products)
            })


        // reaction(
        //     () => [this.currentDish?.products.map(product => toJS(product))],
        //     ([products]) => {
        //         console.log('dish,products', products)

        //         const productIds = dish.productIds
        //         const productsToFetch = this.calculationStore.productStore.getMissingProductIds(productIds)
        //         const currentProducts = dish.products

        //         if (isNotEmpty(productsToFetch)) {
        //             const currentController = this.currentAbortController
        //             this.calculationStore.productStore.fetchAndSetProductNutrientsData(productsToFetch, this.currentAbortController.signal)
        //                 .then(res => {
        //                     if (!res) return
        //                     if (currentController !== this.currentAbortController) return;
        //                     this.calculationStore.update(currentProducts)
        //                 })

        //         }
        //         if (isEmpty(productsToFetch)) {
        //             this.calculationStore.update(currentProducts)
        //         }


        //     })



        autorun(() => {
            if (this.currentDish instanceof DraftDishStore) return
            if (this.currentDish.fetched) {
                return
            }

            // this.getOne(this.currentDish.id).then(result => {
            //     if (!result) return

            //     const products = result.products.map(product => {
            //         const { nutrients, ...data } = product
            //         return data
            //     })
            //     this.currentDish.setFetched(true)
            //     this.currentDish.setProducts(products)

            //     if (this.currentDish instanceof UserDishStore) {
            //         this.currentDish.setInitProductsSnapshot(products)
            //     }
            // })
        })
    }






}
