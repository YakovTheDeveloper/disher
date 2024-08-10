import { makeAutoObservable } from "mobx"
import { IMenu, IProductBase } from "../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct } from "../../types/product/product";

type IMenuStore = {
    create(): IMenu;
    create(menu: IMenu): IMenu;
    setCurrentMenuId(id: string): void
}

export class MenuStore implements IMenuStore {

    menus: IMenu[] = []
    currentMenuId = ''

    get firstMenu() {
        return this.menus[0]
    }

    get currentMenu() {
        return this.menus.find(menu => menu.id === this.currentMenuId)
    }

    get currentMenuProducts() {
        return this.currentMenu!.products.map(el => el)
    }



    constructor() {
        makeAutoObservable(this)
    }

    create = (menu?: IMenu) => {
        if (typeof menu === 'object') {
            this.menus = [...this.menus, menu]
            return menu
        }
        const newMenu = {
            id: uuidv4(),
            name: 'My menu',
            description: '',
            products: []
        }
        this.menus = [...this.menus, newMenu]
        return newMenu
    }

    setCurrentMenuId = (id: string) => {
        this.currentMenuId = id
    }

    changeMenuProductQuantity = (menuId: string, productId: string, quantity: number) => {

        const menu = this.menus.find(({ id }) => id === menuId)
        if (!menu) return
        const product = menu.products.find(({ id }) => id === productId)
        if (!product) return
        product.quantity = quantity
        // this.menus = this.menus.filter(menu => {
        //     if (menu.id !== id) return menu
        //     return {...menu, products:}
        // })
    }

    addTo = (productToAdd: IProductBase) => {

        this.menus = this.menus.map(menu => {
            if (menu.id === this.currentMenuId) {

                const alreadyInMenu = menu.products.find(({ name }) => name === productToAdd.name)
                if (alreadyInMenu) return menu

                return {
                    ...menu,
                    products: [...menu.products, productToAdd]
                }
            }
            return menu
        })

    }
}
