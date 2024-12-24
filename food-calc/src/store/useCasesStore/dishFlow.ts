import { ProductStore } from "@/store/productStore/productStore";
import { RootDayStore2 } from "@/store/rootDayStore/rootDayStore2";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";
import { DishStore, UserDishStore } from "@/store/rootDishStore/dishStore/dishStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { IProductBase } from "@/types/dish/dish";
import { makeAutoObservable } from "mobx";

export class DishFlow {
    constructor(
        private root: RootDishStore,
        private rootDayStore: RootDayStore2,
        private calculations: CalculationReactionStore,
        private notifications: NotificationStore,
        private products: ProductStore
    ) {
        makeAutoObservable(this)
    }

    private shouldRecalculateDay = (dishId: number) => {
        const dishWasInCurrentDay = this.rootDayStore.currentStore?.categories
            .find(({ dishes }) => dishes.find(({ id }) => id === dishId))
        return Boolean(dishWasInCurrentDay)
    }


    getAll = async () => {
        const res = await this.root.fetchManager.getAll()
        if (res.isError) {
            this.notifications.error('dish', 'getAll', '')
            return
        }
        const { data } = res
        const stores = data.map(norm => new UserDishStore(norm))
        this.root.addLocalBulk(stores)
    }



    update = async (dishId: number, dishName: string) => {

        const payload = this.root.currentStore?.payload
        if (!payload) return

        const res = await this.root.fetchManager.update(dishId, payload)
        if (res.isError) {
            this.notifications.error('dish', 'update', dishName)
            return
        }
        this.notifications.success('dish', 'update', dishName)


        const { name, products } = payload
        this.rootDayStore.updateDishInDays(dishId, name, products)
        if (this.shouldRecalculateDay(dishId)) {
            this.calculations.updateDayCalculationsWithCurrentProducts()
        }

    }

    remove = async (dishId: number, dishName: string) => {
        const removedInfo = this.root.removeLocal(dishId);
        if (!removedInfo) return
        this.root.setCurrentId(this.root.draftStore.id)

        const res = await this.root.fetchManager.delete(dishId);

        if (res.isError) {
            this.root.addLocal(removedInfo);
            this.notifications.error('dish', 'delete', dishName);
            return;
        }

        this.root.setCurrentId(this.root.draftStore.id)
        this.notifications.success('dish', 'delete', dishName);

        if (this.shouldRecalculateDay(dishId)) {
            this.calculations.updateDayCalculationsWithCurrentProducts()
        }
    }

    create = async () => {
        const payload = this.root.draftStore.payload
        const res = await this.root.fetchManager.create(payload)
        if (res.isError) {
            this.notifications.error('dish', 'save', payload.name)
            return
        }
        this.root.addLocal(this.root.createChildStore(res.data))
        this.notifications.success('dish', 'save', payload.name)
        this.root.setCurrentId(res.data.id)
        this.root.draftStore.resetToInit()

    }

    addProduct = async (product: IProductBase) => {
        const capturedDish = this.root.currentStore

        capturedDish?.toggleProduct({
            ...product,
            quantity: 100
        })

        this.products.handleGetFullProductData([product.id])
            .then(res => {
                if (res?.isError) {
                    capturedDish?.toggleProduct({
                        ...product,
                        quantity: 100
                    })
                    return
                }
                this.calculations.updateDishCalculationsWithCurrentProducts()
            })
    }
}