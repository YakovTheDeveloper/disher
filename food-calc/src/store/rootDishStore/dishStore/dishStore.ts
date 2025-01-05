import { toJS, autorun, action, makeObservable, observable, computed, reaction, runInAction, makeAutoObservable } from "mobx"
import { IMenu, IProductBase } from "../../../types/menu/Menu"
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { CreateDishPayload } from "@/types/api/menu";
import { DRAFT_MENU_ID, RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { IDish } from "@/types/dish/dish";
import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { DraftStore, UserDataStore } from "@/store/common/types";
import { rootProductStore } from "@/store/rootStore";
import { ProductPortionStore } from "@/store/productStore/rootProductStore";

export class DishStore {
    description = ''
    name = 'New menu'
    id: number = DRAFT_MENU_ID
    products: IProductBase[] = []
    productsV2: DishProduct[] = []
    fetched = false

    get productIds() {
        return this.products.map(({ id }) => id)
    }

    get empty() {
        // return this.products.length === 0
        return this.productsV2.length === 0
    }

    get payload(): CreateDishPayload {
        // const products = createIdToQuantityMapping(this.products)
        return {
            name: this.name,
            description: this.description,
            products: this.products
        }
    }

    convertAllProductsTo100Gr = () => {
        const totalWeight = this.products.reduce((sum, product) => sum + product.quantity, 0);
        runInAction(() => this.products.forEach(product => {
            product.quantity = +((product.quantity / totalWeight) * 100).toFixed()
        }))

    }

    setFetched = (status: boolean) => {
        this.fetched = status
    }

    setData = (data: IDish) => {
        if (data.id) this.id = data.id
        if (data.name) this.name = data.name
        if (data.description) this.description = data.description
        if (data.products) this.products = data.products
        return this
    }

    setProductQuantity = (productId: number, quantity: number) => {
        const product = this.products.find(({ id }) => id === productId)
        if (!product) return
        product.quantity = quantity
    }

    setProducts = (products: IProductBase[]) => {
        this.products = products
    }

    removeProduct = (productId: number) => {
        this.products = this.products.filter(product => +product.id !== productId)
    }

    addTo = (productToAdd: IProductBase) => {
        const existed = this.products.find(product => product.id === productToAdd.id)
        if (existed) return
        this.products.push(productToAdd)
    }

    toggleProduct = (product: IProductBase) => {
        const existed = this.products.find(({ id }) => id === product.id)
        if (existed) {
            this.products = this.products.filter(({ id }) => id !== product.id)
            return
        }
        this.products.push(product)
    }

    toggleProductV2 = (product: IProductBase) => {
        const existed = this.productsV2.find(({ id }) => id === product.id)
        if (existed) {
            this.productsV2 = this.productsV2.filter(({ id }) => id !== product.id)
            return
        }
        this.productsV2.push(new DishProduct(product))
    }

    get productData() {
        return this.products.map(product => product.quantity)
    }

    updateName = (name: string) => { this.name = name }

    resetToInit = () => { }

    constructor(data: IDish) {
        makeObservable(this, {
            name: observable,
            products: observable,
            productsV2: observable,
            productIds: computed,
            productData: computed,
            setProducts: action,
            removeProduct: action,
            toggleProduct: action,
            updateName: action,
            convertAllProductsTo100Gr: action,
        })

        const { id, name, products } = data

        this.id = id
        this.name = name
        this.products = products
        this.productsV2 = products.map(product => new DishProduct(product))
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