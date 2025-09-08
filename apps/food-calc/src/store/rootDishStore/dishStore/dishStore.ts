import { toJS, autorun, action, makeObservable, observable, computed, reaction, runInAction, makeAutoObservable } from "mobx"
import { IMenu, IProductBase } from "../../../types/menu/Menu"
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { CreateDishPayload } from "@/types/api/menu";
import { DRAFT_MENU_ID, RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { IDish } from "@/types/dish/dish";
import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { DraftStore, UserDataStore } from "@/store/common/types";
import { rootProductStore } from "@/store/rootStore";
import { PortionStore, RootPortionStore } from "@/store/productStore/rootProductStore";
import { Portion } from "@/types/common/common";
import { TOTAL_PRODUCTS_PORTION_ID } from "@/constants";

export class DishStore {
    description = ''
    name = 'New menu'
    id: number = DRAFT_MENU_ID
    // products: IProductBase[] = []
    productsV2: DishProduct[] = []
    portionStore: RootPortionStore
    fetched = false

    get productIds() {
        return this.productsV2.map(({ id }) => id)
    }

    get products() {
        return this.productsV2.map(({ id, quantity, name }) => ({
            id, quantity, name
        }))
    }

    get empty() {
        // return this.products.length === 0
        return this.productsV2.length === 0
    }

    get payload(): CreateDishPayload {
        // const products = createIdToQuantityMapping(this.products)
        const { name, description, products, portionStore: { payload } } = this
        return { name, description, products, portions: payload }
    }

    // convertAllProductsTo100Gr = () => {
    //     const totalWeight = this.products.reduce((sum, product) => sum + product.quantity, 0);
    //     runInAction(() => this.products.forEach(product => {
    //         product.quantity = +((product.quantity / totalWeight) * 100).toFixed()
    //     }))

    // }

    setFetched = (status: boolean) => {
        this.fetched = status
    }

    setProductQuantity = (productId: number, quantity: number) => {
        const product = this.productsV2.find(({ id }) => id === productId)
        if (!product) return
        product.quantity = quantity
    }

    removeProduct = (productId: number) => {
        this.productsV2 = this.productsV2.filter(product => +product.id !== productId)
    }

    toggleProductV2 = (product: IProductBase) => {
        const existed = this.productsV2.find(({ id }) => id === product.id)
        if (existed) {
            this.productsV2 = this.productsV2.filter(({ id }) => id !== product.id)
            return
        }
        this.productsV2.push(new DishProduct(product))
    }

    // get productData() {
    //     return this.products.map(product => product.quantity)
    // }

    updateDescription = (value: string) => { this.description = value }

    updateName = (name: string) => { this.name = name }

    resetToInit = () => { }

    updateTotalPortion = () => {
        this.portionStore.updatePortion(-1, this.totalProductsQuantity)
    }

    divideAllProducts = (divider: number) => {
        runInAction(() => this.productsV2.forEach(product => {
            product.quantity = Math.round(product.quantity / divider)
        }))
    }

    get totalProductsQuantity() {
        return this.products.reduce((sum, product) => sum + product.quantity, 0);
    }

    constructor(data: IDish) {
        makeObservable(this, {
            name: observable,
            description: observable,
            productsV2: observable,
            productIds: computed,
            totalProductsQuantity: computed,
            removeProduct: action,
            updateName: action,
            updateDescription: action,
            updateTotalPortion: action,
            divideAllProducts: action,
        })

        const { id, name, products, portions = [], description = '' } = data


        this.portionStore = new RootPortionStore()

        this.id = id
        this.name = name
        this.description = description
        this.productsV2 = products.map(product => new DishProduct(product))
        this.portionStore.setPortions(portions)

        this.portionStore.addPortion({
            id: TOTAL_PRODUCTS_PORTION_ID,
            name: 'Суммарный вес (1 порция)',
            quantity: 0
        })

        autorun(() => this.updateTotalPortion())

        reaction(
            () => toJS(this.products),
            (_) => this.updateTotalPortion()
        );
    }

}


export class UserDishStore extends DishStore implements UserDataStore<IProductBase[]> {
    constructor(data: IDish) {
        super(data);
        makeObservable(this, {
            resetToInit: action,
        });
        this.detectChangesStore = new DetectChangesStore(this.products);

        // reaction(
        //     () => [toJS(this.products)],
        //     ([data]) => {
        //         this.detectChangesStore.setData(data)
        //     }
        // );
    }

    detectChangesStore: DetectChangesStore<IProductBase[]>


    resetToInit = () => {
        const snapshot = this.detectChangesStore.initProductsSnapshotCopy
        if (!snapshot) return
        this.products = snapshot
        this.detectChangesStore.changeOccured = false;
    };


    // save = async (id: number) => {
    //     const captureState = structuredClone(toJS(this.products))
    //     return this.rootStore.updateDish(this.payload, id).then((res) => {
    //         if (res.isError) return res
    //         this.detectChangesStore.updateSnapshot(captureState)
    //         return res
    //     }
    //     );
    // };

    // remove = async (id: number) => {
    //     const res = await this.rootStore.removeDish(id);
    //     return res
    // };

}

export class DraftDishStore extends DishStore implements DraftStore<IProductBase[]> {
    constructor(data: IDish) {
        super(data);

        makeObservable(this, {
        })

    }

    resetToInit = () => {
        this.name = ''
        this.products = []
    }
}

export class DishProduct {
    constructor({ id, name, quantity }: IProductBase, private productStore = rootProductStore) {
        makeAutoObservable(this)
        this.id = id
        this.name = name
        this.quantity = quantity
        this._portions = this.productStore.userStoresMap[this.id].portions
        this.currentPortion = ''
    }

    id: number
    name: string
    quantity: number

    currentPortion: string

    _portions: ProductPortionStore[]

    get portions() {
        return this.productStore.userStoresMap[this.id].portions.map(({ name, quantity }) => ({
            name, quantity
        }))
    }

    setQuantity = (quantity: number) => this.quantity = quantity

    setCurrentPortion = (portion: string) => this.currentPortion = portion
}