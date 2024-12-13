import { RootDayStore2 } from "@/store/rootDayStore/rootDayStore2";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { makeAutoObservable } from "mobx";

export class DishFlow {
    constructor(
        private rootDishStore: RootDishStore,
        private rootDayStore: RootDayStore2,
        private calculations: CalculationReactionStore,
        private notifications: NotificationStore
    ) {
        makeAutoObservable(this)
    }

    private shouldRecalculateDay = (dishId: number) => {
        const dishWasInCurrentDay = this.rootDayStore.currentStore?.categories
            .find(({ dishes }) => dishes.find(({ id }) => id === dishId))
        return Boolean(dishWasInCurrentDay)
    }

    update = async (dishId: number, dishName: string) => {

        const payload = this.rootDishStore.currentDish?.payload
        if (!payload) return

        const res = await this.rootDishStore.updateDish(payload, dishId)
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
        const res = await this.rootDishStore.removeDish(dishId)
        if (res.isError) {
            this.notifications.error('dish', 'delete', dishName)
            return
        }
        this.notifications.success('dish', 'delete', dishName)

        this.rootDayStore.removeDishFromDays(dishId)
        if (this.shouldRecalculateDay(dishId)) {
            this.calculations.updateDayCalculationsWithCurrentProducts()
        }
    }

    save = async () => {
        const payload = this.rootDishStore.draftDish.payload
        const res = await this.rootDishStore.saveDish()
        if (res.isError) {
            this.notifications.error('dish', 'save', payload.name)
            return
        }
        this.notifications.success('dish', 'save', payload.name)
    }
}