import { fetchGetProducts, fetchGetProductWithNutrients, fetchUpdatePartProducts } from "@/api/product";
import { isEmpty } from "@/lib/empty";
import { FetchManager, FetchManagerStore } from "@/store/common/FetchManagerStore";
import { LoadingStateStore } from "@/store/common/LoadingStateStore";
import { RootEntityStore } from "@/store/common/types";
import { Response } from "@/types/api/common";
import { GetProductWithNutrientsPayload } from "@/types/api/product";
import { IdToQuantity, Portion } from "@/types/common/common";
import { Product, ProductIdToNutrientsMap, ProductIdToPortionsMap, ProductPortion } from "@/types/product/product";
import { GenerateId } from "@/utils/uuidNumber";
import { makeObservable, observable, makeAutoObservable, action, toJS } from "mobx";

type ProductInit = Pick<Product, 'id' | 'name'> & Partial<Omit<Product, 'id' | 'name'>>;


export class RootProductStore extends RootEntityStore<
    Product,
    ProductStore,
    DraftProductStore
> {
    constructor() {
        super(ProductStore)
        makeObservable(this, {
            draftStore: observable,
            getMissingProductIds: action
        });
    }



    draftStore: DraftProductStore = new DraftProductStore({
        id: DRAFT_MENU_ID,
        name: "",
        nutrients: {},
        portions: []
    })

    fetchManager: FetchManager<Product> & {
        fetchById: (ids: number[]) => Promise<{
            isError: true;
            error: string;
        } | {
            data: {
                id: number;
                portions: ProductPortion[];
                nutrients: IdToQuantity;
            }[];
            isError: false;
        }>
    } = new ProductFetchManager(this.loadingState)

    getMissingProductIds = (ids: number[]): number[] => {
        return ids.filter(id => isEmpty(this.userStoresMap[id].nutrients));
    }

}

export const DRAFT_MENU_ID = -1;

export class ProductStore {
    constructor({ id, name, nutrients = {}, portions = [] }: ProductInit) {
        this.id = id
        this.name = name
        this.nutrients = nutrients
        this.portions = portions.map(portion => new PortionStore(portion))
        makeObservable(this, {
            id: observable,
            name: observable,
            nutrients: observable,
            portions: observable,
            setNutrients: action,
            updateNutrients: action,
            updateName: action,
            addPortion: action,
            removePortion: action,
            setPortions: action,
        })
    }
    id = -1
    name = ""
    nutrients: IdToQuantity = {}
    portions: PortionStore[] = []

    setNutrients = (nutrients: IdToQuantity) => this.nutrients = nutrients
    updateNutrients = (id: number, quantity: number) => this.nutrients[id] = quantity
    updateName = (name: string) => this.name = name

    setPortions = (portions: ProductPortion[]) => {
        this.portions = portions.map(portion => new PortionStore(portion))
    }

    addPortion = () => {
        this.portions.push(new PortionStore({ id: GenerateId(), name: 'Название порции', quantity: 0 }))
    }

    removePortion = (portionId: number) => {
        this.portions = this.portions.filter(({ id }) => id !== portionId)
    }



    get payload() {
        const { name, portions } = this
        return {
            name,
            portions: portions.map(portion => portion.payload)
        }
    }
}

export class RootPortionStore {
    constructor() {
        makeAutoObservable(this)
    }

    portions: PortionStore[] = []

    get portionsRaw() {
        return this.portions.map(({ payload }) => payload)
    }

    get payload() {
        return this.portions.map(({ payload }) => payload)
    }

    setPortions = (portions: ProductPortion[]) => {
        this.portions = portions.map(portion => new PortionStore(portion))
    }

    addPortion = (portion?: ProductPortion) => {
        console.log("this.portions", toJS(this.portions), portion)
        if (portion) {
            this.portions.push(new PortionStore(portion))
            return
        }
        this.portions.push(new PortionStore({ id: GenerateId(), name: 'Название порции', quantity: 0 }))
        return
    }

    updatePortion = (portionId: number, newQuantity: number) => {
        const portion = this.portions.find(({ id }) => id === portionId)
        if (!portion) return
        portion.quantity = newQuantity
    }

    removePortion = (portionId: number) => {
        this.portions = this.portions.filter(({ id }) => id !== portionId)
    }
}

export class PortionStore {
    constructor({ id, name, quantity }: ProductPortion) {
        makeAutoObservable(this)
        this.id = id
        this.name = name
        this.quantity = quantity
    }
    id = -1
    name = ''
    quantity = 0
    editable = true

    updateName = (name: string) => this.name = name
    updateQuantity = (quantity: number) => this.quantity = quantity

    get payload() {
        const { name, quantity } = this
        return { name, quantity }
    }
}


export class UserProductStore extends ProductStore {
    constructor(product: ProductInit) {
        super(product)
        makeObservable(this)
    }
}

export class DraftProductStore extends ProductStore {
    constructor(product: ProductInit) {
        super(product)
        makeObservable(this)
    }
}


export class ProductFetchManager extends FetchManagerStore<Product> {
    protected fetchCreate(payload: Omit<Product, "id">) {
        return async () => { }
    }
    protected fetchAll() {
        return fetchGetProducts()
    }
    protected fetchUpdate(id: number, payload: Partial<Product>) {
        return fetchUpdatePartProducts(id, payload)
    }
    protected fetchDelete(id: number) {
        return async () => { }
    }

    async fetchById(ids: number[]) {
        ids.forEach(id => this.loadingStore.setLoading('getOne', true, id))
        const res = await fetchGetProductWithNutrients(ids)

        if (res.isError) {
            ids.forEach(id => this.loadingStore.setLoading('getOne', false, id))
            return res
        }

        ids.forEach(id => this.loadingStore.setLoading('getOne', false, id))
        // this.setProductNutrientData(res.data.nutrients)
        return res
    }

}