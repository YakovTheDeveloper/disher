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

export class RootMenuStore implements IRootMenuStore {

    productStore: ProductStore;

    draftMenu = new DraftMenuStore().setData({
        id: DRAFT_MENU_ID
    })

    menus: MenuStore[] = [this.draftMenu]

    currentMenuId: number | 'draft-menu' = DRAFT_MENU_ID

    setCurrentMenuId = (id: number | 'draft-menu') => {
        this.currentMenuId = id
    }

    get currentMenu(): MenuStore {
        return this.menus.find(menu => menu.id === this.currentMenuId) || this.draftMenu
    }

    getAll = async () => {
        fetchGetAllMenu("menu").then(
            action("fetchSuccess", res => {

                res.forEach(({ description, id, name }) => {
                    const store = new UserMenuStore()
                    store.description = description
                    store.id = id
                    store.name = name
                    this.menus.push(store)
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

    deleteCurrentMenu = async (): Promise<any> => {
        if (this.currentMenu instanceof DraftMenuStore) return
        console.log("detail", +this.currentMenu.id)

        const foodCollectionId = +this.currentMenu.id;

        return fetchDeleteMenu(foodCollectionId).then(
            action("fetchSuccess", res => {

                this.menus = this.menus.filter(menu => menu.id !== foodCollectionId)
                this.currentMenuId = DRAFT_MENU_ID
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

                if (this.currentMenu instanceof UserMenuStore) {
                    this.currentMenu.setInitProductsSnapshot(products)
                }
            })
        })
    }






}
