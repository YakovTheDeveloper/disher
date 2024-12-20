import { DRAFT_ID, RootDayStore2 } from "@/store/rootDayStore/rootDayStore2";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { makeAutoObservable } from "mobx";

export class DayFlow {
    constructor(
        private rootDayStore: RootDayStore2,
        private notifications: NotificationStore
    ) {
        makeAutoObservable(this)
    }


    update = async (dayId: number, dishName: string) => {

        const payload = this.rootDayStore.currentStore?.generatePayload()
        if (!payload) return

        const res = await this.rootDayStore.updateDay(dayId, payload)
        if (res.isError) {
            this.notifications.error('day', 'update', dishName)
            return
        }
        this.notifications.success('day', 'update', dishName)

    }

    remove = async (dayId: number, dayName: string) => {
        const removedInfo = this.rootDayStore.removeLocal(dayId);
        if (!removedInfo) return
        this.rootDayStore.setCurrentDayId(this.rootDayStore.draftDayStore.id)

        const res = await this.rootDayStore.removeDay(dayId);

        if (res.isError) {
            this.rootDayStore.addLocal(removedInfo);
            this.notifications.error('day', 'delete', dayName);
            return;
        }

        this.notifications.success('day', 'delete', dayName);
    };

    create = async () => {
        //todo generate payload -> payload
        const payload = this.rootDayStore.draftDayStore.generatePayload()
        const res = await this.rootDayStore.addDay(payload)
        if (res.isError) {
            this.notifications.error('day', 'save', payload.name)
            return
        }
        this.notifications.success('day', 'save', payload.name)
    }
}