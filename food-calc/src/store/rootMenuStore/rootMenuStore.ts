import { action, autorun, makeAutoObservable, toJS } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct } from "../../types/product/product";
import { MenuStore } from "@/store/rootMenuStore/menuStore/menuStore";
import { fetchCreateMenu, fetchGetAllMenu, fetchGetMenu } from "@/api/menu";
import { MenuPayload } from "@/types/api/menu";
import { ProductStore } from "@/store/productStore/productStore";

type IRootMenuStore = {
    setCurrentMenuId(id: number): void
    productStore: ProductStore
}

export const DRAFT_MENU_ID = 'draft-menu'

export class RootMenuStore implements IRootMenuStore {

    productStore: ProductStore;

    constructor(productStore: ProductStore) {
        this.productStore = productStore
        makeAutoObservable(this)

        autorun(() => {
            this.getAll()
        })

        autorun(() => {
            if (this.currentMenuId === DRAFT_MENU_ID) return
            this.getOne(this.currentMenuId).then(result => {
                if (!result) return



                // const { setProductNutrientData } = this.productStore
                // setProductNutrientData()

                const products = result.data.map(product => {
                    const { nutrients, ...data } = product
                    return data
                })
                this.currentMenu.setProducts(products)
            })
            console.log('this.currentMenu', this.currentMenu)
        })
    }

    menus = [new MenuStore()]

    currentMenuId: number | 'draft-menu' = DRAFT_MENU_ID

    setCurrentMenuId = (id: number) => {
        this.currentMenuId = id
    }

    get currentMenu() {
        return this.menus.find(menu => menu.menu?.id === this.currentMenuId) || this.menus[0]
    }

    saveNew = async (menu: MenuPayload) => {

        return fetchCreateMenu(menu).then(
            action("fetchSuccess", res => res),
            action("fetchError", error => {
            })
        )
    }

    getAll = async () => {
        return fetchGetAllMenu().then(
            action("fetchSuccess", res => {
                res.forEach(({ description, id, name }) => {
                    const store = new MenuStore()
                    const { menu } = store
                    menu.description = description
                    menu.id = id
                    menu.name = name
                    this.menus.push(store)
                })
            }),
            action("fetchError", error => {
            })
        )
    }

    getOne = async (id: number) => {
        return fetchGetMenu(id).then(
            action("fetchSuccess", res => res),
            action("fetchError", error => {
            })
        )
    }







}
