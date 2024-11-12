import { makeAutoObservable, toJS, autorun, override, action, makeObservable, observable, computed, reaction } from "mobx"
import { IMenu, IProductBase } from "../../../types/menu/Menu"
import { v4 as uuidv4 } from 'uuid';
import { IProduct } from "../../types/product/product";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { CreateMenuPayload } from "@/types/api/menu";
import { DRAFT_MENU_ID } from "@/store/rootMenuStore/rootMenuStore";
import { createIdToQuantityMapping } from "@/utils/transformation";
import { fetchCreateMenu, fetchDeleteMenu, fetchUpdateMenu, FoodCollection } from "@/api/menu";
import { isEqual } from "@/utils/comparison";
import { productStore, rootMenuStore } from "@/store/rootStore";
import { emitter, EVENTS } from "@/store/emitter";

type IMenuStore = {
    create(): IMenu;
    create(menu: IMenu): IMenu;
    setCurrentMenuId(id: string): void
    save: VoidFunction
}

type CalcSource = {
    id: number,
    name: string,
    products: IProductBase[]
}

export abstract class MenuStore {
    description = ''
    name = 'New menu'
    id: string | number = DRAFT_MENU_ID
    _products: IProductBase[] = []
    fetched = false
    collectionType: FoodCollection | null = null

    get products() {
        return this._products
    }

    get createMenuPayload(): CreateMenuPayload {
        const products = createIdToQuantityMapping(this.products)
        return {
            name: this.name,
            description: this.description,
            products
        }
    }

    setFetched = (status: boolean) => {
        this.fetched = status
    }

    setData = (data: {
        collectionType?: FoodCollection | null,
        id?: string | number
    }) => {
        if (data.collectionType) this.collectionType = data.collectionType
        if (data.id) this.id = data.id
        return this
    }

    setProductQuantity = (productId: string, quantity: number) => {
        const product = this.products.find(({ id }) => id === productId)
        if (!product) return
        product.quantity = quantity
    }

    setProducts = (products: IProductBase[]) => {
        this._products = products
    }

    removeProduct = (productId: number) => {
        this._products = this._products.filter(product => +product.id !== productId)
    }

    addTo = (productToAdd: IProductBase) => {
        const existed = this.products.find(product => product.id === productToAdd.id)
        if (existed) return
        this.products.push(productToAdd)
    }

    _additionalCalculationSourcesIds: number[] = []

    setAdditionalCalculationSourcesIds = (ids: number[]) => {
        this._additionalCalculationSourcesIds = ids
    }

    calculations = new CalculationStore(this)

    _additionalCalculationSources: CalcSource[] = []

    _additionalCalculationSourceIds: number[] = []

    get additionalCalculationSources() {
        return this._additionalCalculationSources
    }

    addAdditionalCalculationSources = (sources: CalcSource[]) => {

        this._additionalCalculationSources = [...this._additionalCalculationSources, ...sources]

    }

    removeAdditionalCalculationSources = (sourceId: number) => {
        this._additionalCalculationSources = this._additionalCalculationSources.filter(
            ({ id }) => id !== sourceId
        )
    }

    patchAdditionalCalculationSources = (source: CalcSource) => {
        this._additionalCalculationSources = this._additionalCalculationSources.map(
            (initSource) => {
                if (initSource.id === source.id) return source
                return initSource
            }
        )
    }

    get additionalSourceProducts() {
        return this._additionalCalculationSources.map(({ products }) => products).flat()
    }


    async save(id?: number): Promise<unknown> {

    }

    constructor() {
        makeObservable(this, {
            _additionalCalculationSources: observable,
            _products: observable,
            _additionalCalculationSourcesIds: observable,
            products: computed,
            additionalSourceProducts: computed,
            setProducts: action,
            removeProduct: action,
            additionalCalculationSources: computed,
            addAdditionalCalculationSources: action,
            removeAdditionalCalculationSources: action,
            setAdditionalCalculationSourcesIds: action,
            collectionType: observable
        })


        autorun(() => {
            console.log('product.products!!',toJS(this._additionalCalculationSourcesIds))
            
            this._additionalCalculationSourcesIds.forEach(dishId => {
                console.log('product.products',dishId)

                const product = rootMenuStore.dishes.find(dish => dish.id === dishId)
                if (product) {
                    console.log('product.products',product.products)
                }
            })




            const total = this.calculations.calculateNutrients([...this.products])
            this.calculations.setTotal(total)
        })
        // autorun(() => {
        //     let dishes = this._additionalCalculationSources
        //     dishes = dishes.map(({ products }) => products).flat()
        //     const total = this.calculations.calculateNutrients([...this.products, ...dishes])
        //     this.calculations.setTotal(total)
        // })
    }

}


export class UserMenuStore extends MenuStore {
    constructor() {
        super()
        makeObservable(this, {
            _initProductsSnapshot: observable,
            changeOccured: observable,
            save: action,
            setInitProductsSnapshot: action,
            resetToInit: action,
            initProductsSnapshot: computed
        })

        reaction(
            () => [toJS(this._initProductsSnapshot), toJS(this._products)],
            ([snapshot, products]) => {
                this.changeOccured = !isEqual(snapshot, products);
            }
        );
    }

    async save(id: number): Promise<unknown> {
        return fetchUpdateMenu(id, this.createMenuPayload, this.collectionType).then(
            action("fetchSuccess", res => {
                const updated = JSON.parse(JSON.stringify(this._products)) as IProductBase[]
                this._initProductsSnapshot = updated

                if (this.collectionType === 'dish') {
                    emitter.dispatchEvent(new CustomEvent(EVENTS.DISH_UPDATED, {
                        detail: {
                            name: this.name,
                            id: this.id,
                            products: updated,
                        } as CalcSource
                    }));
                }

            }),
            action("fetchError", error => {
            })
        )
    }


    changeOccured: boolean = false;

    _initProductsSnapshot: IProductBase[] | null = null

    get initProductsSnapshot() {
        return this._initProductsSnapshot
    }

    resetToInit = () => {
        if (!this._initProductsSnapshot) return
        this._products = JSON.parse(JSON.stringify(this._initProductsSnapshot))
        this.changeOccured = false
    }

    setInitProductsSnapshot = (products: IProductBase[]) => {
        this._initProductsSnapshot = products
    }
}

export class DraftMenuStore extends MenuStore {
    constructor() {
        super()
        makeObservable(this, {
            save: action
        })
        autorun(() => {
        })
    }


    async save() {
        return fetchCreateMenu(this.createMenuPayload, this.collectionType).then(
            action("fetchSuccess", res => {
                res.id
            }),
            action("fetchError", error => {
            })
        )
    }
}