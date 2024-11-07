import { makeAutoObservable, toJS, autorun } from "mobx"
import { IMenu, IProductBase } from "../../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct } from "../../types/product/product";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { CreateMenuPayload } from "@/types/api/menu";
import { DRAFT_MENU_ID } from "@/store/rootMenuStore/rootMenuStore";
import { createIdToQuantityMapping } from "@/utils/transformation";

type IMenuStore = {
    create(): IMenu;
    create(menu: IMenu): IMenu;
    setCurrentMenuId(id: string): void
}

export class MenuStore {

    constructor() {
        makeAutoObservable(this)

        // autorun(() => {
        //     const wtf = this.menu.products
        //     console.log("wtf__MenuStore", toJS(wtf))
        // })
    }

    menu: IMenu = {
        description: '',
        name: 'New menu',
        id: DRAFT_MENU_ID,
        products: []
    }

    get products() {
        return this.menu!.products.map(el => el)
    }

    get createMenuPayload(): CreateMenuPayload {
        const { description, name } = this.menu
        const products = createIdToQuantityMapping(this.menu.products)
        return {
            name,
            description,
            products
        }
    }

    setMenu = (menu: IMenu) => {
        this.menu = menu
        return this
    }

    setProductQuantity = (productId: string, quantity: number) => {
        const product = this.menu?.products.find(({ id }) => id === productId)
        if (!product) return
        product.quantity = quantity
    }

    setProducts = (products: IProductBase[]) => {
        this.menu.products = products
    }

    addTo = (productToAdd: IProductBase) => {
        const existed = this.menu?.products.find(product => product.id === productToAdd.id)
        if (existed) return
        this.menu?.products.push(productToAdd)
    }


    calculations = new CalculationStore(this)

}

