import { action, autorun, makeAutoObservable, toJS } from "mobx"
import { IMenu, IProductBase, IProductWithNutrients } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct } from "../../types/product/product";
import { DraftMenuStore, MenuStore, UserMenuStore } from "@/store/rootMenuStore/menuStore/menuStore";
import { fetchCreateMenu, fetchDeleteMenu, fetchGetAllMenu, fetchGetMenu, FoodCollection } from "@/api/menu";
import { MenuPayload } from "@/types/api/menu";
import { ProductStore } from "@/store/productStore/productStore";
import { emitter, EVENTS } from "@/store/emitter";

type IRootMenuStore = {
    setCurrentMenuId(id: number): void
    productStore: ProductStore
}

export const DRAFT_MENU_ID = 'draft-menu'
export const DRAFT_DISH_ID = 'draft-menu-dish'

export class RootMenuStore implements IRootMenuStore {

    productStore: ProductStore;

    draftMenu = new DraftMenuStore().setData({
        collectionType: 'menu',
        id: DRAFT_MENU_ID
    })
    draftDishCollection = new DraftMenuStore().setData({
        collectionType: 'dish',
        id: DRAFT_DISH_ID
    })

    menus: MenuStore[] = [this.draftMenu]
    dishes: MenuStore[] = [this.draftDishCollection]

    currentMenuId: number | 'draft-menu' = DRAFT_MENU_ID

    setCurrentMenuId = (id: number | 'draft-menu') => {
        this.currentMenuId = id
    }

    get currentMenu(): MenuStore {
        return [...this.menus, ...this.dishes].find(menu => menu.id === this.currentMenuId) || this.draftMenu
    }

    removeDishFromMenu = (id: number) => [
        this.menus.forEach(menu => {
            menu.removeAdditionalCalculationSources(id)
        })
    ]

    patchDishInMenu = (payload: any) => {
        this.menus.forEach(menu => {
            menu.patchAdditionalCalculationSources(payload)
        })
    }

    getAll = async () => {
        fetchGetAllMenu("menu").then(
            action("fetchSuccess", res => {

                res.forEach(({ description, id, name }) => {
                    const store = new UserMenuStore()
                    store.description = description
                    store.id = id
                    store.name = name
                    store.collectionType = 'menu'
                    this.menus.push(store)
                })
            }),
            action("fetchError", error => {
            })
        )
        fetchGetAllMenu("dish").then(
            action("fetchSuccess", res => {

                res.forEach(({ description, id, name }) => {
                    const store = new UserMenuStore()
                    store.description = description
                    store.id = id
                    store.name = name
                    store.collectionType = 'dish'
                    this.dishes.push(store)
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
        return fetchGetMenu(id, this.currentMenu.collectionType).then(
            action("fetchSuccess", res => res.result),
            action("fetchError", error => {
            })
        )
    }

    addDish = async (id: number, name: string) => {
        return fetchGetMenu(id, 'dish').then(
            action("fetchSuccess", res => {
                this.currentMenu.addAdditionalCalculationSources([{
                    id,
                    name,
                    products: res.result.products
                }])
            }
            ),
            action("fetchError", error => {
            })
        )
    }

    deleteCurrentMenu = async (): Promise<any> => {
        if (this.currentMenu instanceof DraftMenuStore) return
        const type = this.currentMenu.collectionType
        console.log("detail", +this.currentMenu.id)

        const foodCollectionId = +this.currentMenu.id;

        return fetchDeleteMenu(foodCollectionId, type).then(
            action("fetchSuccess", res => {

                if (type === 'menu') {
                    this.menus = this.menus.filter(menu => menu.id !== foodCollectionId)
                    this.currentMenuId = DRAFT_MENU_ID
                }
                if (type === 'dish') {
                    emitter.dispatchEvent(new CustomEvent(EVENTS.DISH_DELETED, {
                        detail: foodCollectionId
                    }))
                    this.dishes = this.dishes.filter(dish => dish.id !== foodCollectionId)
                    this.currentMenuId = DRAFT_DISH_ID
                    console.log("detail", foodCollectionId)
                }
            }),
            action("fetchError", error => {
            }) 
        )
    }

    constructor(productStore: ProductStore) {
        this.productStore = productStore
        makeAutoObservable(this)

        emitter.addEventListener(EVENTS.DISH_UPDATED, (event) => {
            this.patchDishInMenu(event.detail);
        });


        emitter.addEventListener(EVENTS.DISH_DELETED, (event) => {
            this.removeDishFromMenu(event.detail);
        });

        autorun(() => {

            this.getAll()
        })

        autorun(() => {
            if (this.currentMenu instanceof DraftMenuStore) return
            if (this.currentMenu.fetched) {
                return
            }

            this.getOne(this.currentMenu.id).then(result => {
                if (!result) return
               
                const products = result.products.map(product => {
                    const { nutrients, ...data } = product
                    return data
                })
                this.currentMenu.setFetched(true)
                this.currentMenu.setProducts(products)
                this.currentMenu.setAdditionalCalculationSourcesIds(result.dishIds)

                if (this.currentMenu instanceof UserMenuStore) {
                    this.currentMenu.setInitProductsSnapshot(products)
                }
            })
        })
    }






}
