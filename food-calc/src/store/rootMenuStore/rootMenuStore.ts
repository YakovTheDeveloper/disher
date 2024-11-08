import { action, autorun, makeAutoObservable, toJS } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct } from "../../types/product/product";
import { DraftMenuStore, MenuStore, UserMenuStore } from "@/store/rootMenuStore/menuStore/menuStore";
import { fetchCreateMenu, fetchDeleteMenu, fetchGetAllMenu, fetchGetMenu, FoodCollection } from "@/api/menu";
import { MenuPayload } from "@/types/api/menu";
import { ProductStore } from "@/store/productStore/productStore";

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

    // saveNew = async (menu: MenuPayload, type: FoodCollection) => {

    //     // const type = this.currentMenu.collectionType

    //     return fetchCreateMenu(menu, type).then(
    //         action("fetchSuccess", res => res),
    //         action("fetchError", error => {
    //         })
    //     )
    // }

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

    getOne = async (id: number) => {
        return fetchGetMenu(id, this.currentMenu.collectionType).then(
            action("fetchSuccess", res => res),
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
                    products: res.data
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
        return fetchDeleteMenu(+this.currentMenu.id, type).then(
            action("fetchSuccess", res => {
                if (type === 'menu')
                    this.menus = this.menus.filter(menu => menu.id !== +this.currentMenu.id)
                else this.dishes = this.dishes.filter(dish => dish.id !== +this.currentMenu.id)
                this.setCurrentMenuId(DRAFT_MENU_ID)
            }),
            action("fetchError", error => {
            })
        )
    }

    constructor(productStore: ProductStore) {
        this.productStore = productStore
        makeAutoObservable(this)

        autorun(() => {
            this.getAll()
        })

        autorun(() => {
            // if (this.currentMenuId === DRAFT_MENU_ID) return

            if (this.currentMenu instanceof DraftMenuStore) return

            // const menuExist = this.menus.find(menu => menu.id === )
            if (this.currentMenu.fetched) {
                return
            }

            this.getOne(this.currentMenu.id).then(result => {
                if (!result) return
                const products = result.data.map(product => {
                    const { nutrients, ...data } = product
                    return data
                })
                this.currentMenu.setFetched(true)
                this.currentMenu.setProducts(products)

                if (this.currentMenu instanceof UserMenuStore) {
                    this.currentMenu.setInitProductsSnapshot(products)
                }
            })
        })
    }






}
