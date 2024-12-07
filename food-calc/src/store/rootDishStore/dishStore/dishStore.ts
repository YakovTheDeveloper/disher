import { toJS, autorun, action, makeObservable, observable, computed, reaction } from "mobx"
import { IMenu, IProductBase } from "../../../types/menu/Menu"
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { CreateDishPayload } from "@/types/api/menu";
import { DRAFT_MENU_ID, RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { IDish } from "@/types/dish/dish";
import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { DraftStore, UserDataStore } from "@/store/common/types";

type IMenuStore = {
    create(): IMenu;
    create(menu: IMenu): IMenu;
    setCurrentDishId(id: string): void
    save: VoidFunction
}

type CalcSource = {
    id: number,
    name: string,
    products: IProductBase[]
}

export class DishStore {
    description = ''
    name = 'New menu'
    id: number = DRAFT_MENU_ID
    products: IProductBase[] = []
    fetched = false

    get productIds() {
        return this.products.map(({ id }) => id)
    }

    get empty() {
        return this.products.length === 0
    }

    get payload(): CreateDishPayload {
        // const products = createIdToQuantityMapping(this.products)
        return {
            name: this.name,
            description: this.description,
            products: this.products
        }
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

    calculations = new CalculationStore()



    async save(id?: number): Promise<unknown> {

    }

    resetToInit = () => { }

    constructor(rootDishStore: RootDishStore) {
        makeObservable(this, {
            products: observable,
            // products: computed,
            productIds: computed,
            setProducts: action,
            removeProduct: action,
            toggleProduct: action,
        })


        autorun(() => {
            const total = this.calculations.calculateNutrients([...this.products])
            this.calculations.setTotal(total)
        })
    }



}


export class UserDishStore extends DishStore implements UserDataStore<IProductBase[]> {
    constructor(private rootStore: RootDishStore) {
        super(rootStore);
        makeObservable(this, {
            save: action,
            resetToInit: action,
            remove: action,
            loading: computed
        });
        this.detectChangesStore = new DetectChangesStore(this.products);

        reaction(
            () => [toJS(this.products)],
            ([data]) => {
                this.detectChangesStore.setData(data)
            }
        );
    }

    detectChangesStore: DetectChangesStore<IProductBase[]>


    resetToInit = () => {
        const snapshot = this.detectChangesStore.initProductsSnapshotCopy
        if (!snapshot) return
        this.products = snapshot
        this.detectChangesStore.changeOccured = false;
    };


    save = async (id: number) => {
        const captureState = structuredClone(toJS(this.products))
        return this.rootStore.updateDish(this.payload, id).then(
            action("fetchSuccess", (res) => {
                res && this.detectChangesStore.updateSnapshot(captureState)
                return !!res
            }),
            action("fetchError", (error) => {
                console.error("Save failed", error);
                return false
            })
        );
    };

    remove = async (id: number) => {
        const res = await this.rootStore.removeDish(id);
        return res
    };

    get loading() {
        const state = this.rootStore.fetchManager.loading;
        return state.update.get(+this.id) || state.delete.get(+this.id) || false;
    }


}

export class DraftDishStore extends DishStore implements DraftStore<IProductBase[]> {
    constructor(private rootStore: RootDishStore) {
        super(rootStore)
        makeObservable(this, {
            save: action,
            loading: computed

        })

    }

    resetToInit = () => {
        this.name = 'Новое блюдо'
        this.products = []
    }

    get loading() {
        return this.rootStore.fetchManager.loading.save;
    }


    save = async () => {
        return this.rootStore.fetchManager.create(this.payload).then(
            action("fetchSuccess", res => {
                if (!res) return res
                const store = this.rootStore.createDishStore(res)
                this.rootStore.addDishStore(store)
                this.rootStore.setCurrentDishId(res.id)
                this.resetToInit()
                return !!res
            }),
            action("fetchError", error => {
                return false
            })
        )
    }
}


// export class UserDishStore extends DishStore {
//     constructor(private rootDishStore: RootDishStore) {
//         super(rootDishStore);

//         makeObservable(this, {
//             _initProductsSnapshot: observable,
//             changeOccured: observable,
//             save: action,
//             setInitProductsSnapshot: action,
//             resetToInit: action,
//             initProductsSnapshot: computed,
//         });

//         // Initialize the snapshot and start the reaction
//         this._initProductsSnapshot = null;
//         this.changeOccured = false;

//         reaction(
//             () => [toJS(this._initProductsSnapshot), toJS(this.products)],
//             ([snapshot, products]) => {
//                 this.changeOccured = !isEqual(snapshot, products);
//             }
//         );
//     }

//     save = async (id: number): Promise<unknown> => {
//         const captureState = structuredClone(toJS(this.products))
//         return fetchUpdateDish(id, this.payload).then(
//             action("fetchSuccess", (res) => {
//                 console.log("@@@", res)
//                 this._initProductsSnapshot = captureState
//                 this.changeOccured = false;
//             }),
//             action("fetchError", (error) => {
//                 console.error("Save failed", error);
//             })
//         );
//     };

//     removeDish = async (id: string) => {
//         this.rootDishStore.removeDish(id);
//     };

//     changeOccured: boolean = false;

//     _initProductsSnapshot: IProductBase[] | null = null;

//     get initProductsSnapshot() {
//         return this._initProductsSnapshot;
//     }

//     setInitProductsSnapshot(products: IProductBase[]) {
//         this._initProductsSnapshot = structuredClone(products)
//     }

//     resetToInit = () => {
//         console.log("this._initProductsSnapsho", this._initProductsSnapshot)
//         if (!this._initProductsSnapshot) return;
//         this.products = structuredClone(toJS(this._initProductsSnapshot));
//         this.changeOccured = false;
//     };
// }