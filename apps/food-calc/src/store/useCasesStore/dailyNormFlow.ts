import { DailyNormStore, RootDailyNormStore, UserNormStore } from "@/store/dailyNormStore/dailyNormStore";
import { DRAFT_ID, RootDayStore2 } from "@/store/rootNormStore/rootDayStore2";
import { CalculationReactionStore } from "@/store/rootDishStore/calculationReactionStore";
import { RootDishStore } from "@/store/rootDishStore/rootDishStore";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { makeAutoObservable, toJS } from "mobx";

export class DailyNormFlow {
    constructor(
        private rootStore: RootDailyNormStore,
        private notifications: NotificationStore
    ) {
        makeAutoObservable(this)

    }

    update = async (normId: number, normName: string) => {

        const payload = this.rootStore.currentStore?.payload
        if (!payload) return

        console.log('payloadpayload', toJS(payload.nutrients))

        const res = await this.rootStore.fetchManager.update(normId, payload)
        if (res.isError) {
            this.notifications.error('norm', 'update', normName)
            return
        }
        this.notifications.success('norm', 'update', normName)

    }

    remove = async (normId: number, normName: string) => {
        const removedInfo = this.rootStore.removeLocal(normId);
        if (!removedInfo) return
        this.rootStore.setCurrentId(this.rootStore.draftStore.id)

        const res = await this.rootStore.fetchManager.delete(normId);

        if (res.isError) {
            this.rootStore.addLocal(removedInfo);
            this.notifications.error('norm', 'delete', normName);
            return;
        }

        this.notifications.success('norm', 'delete', normName);
    };

    getAll = async () => {
        const { notifications, rootStore: { fetchManager, addLocalBulk }, } = this

        const res = await fetchManager.getAll()

        if (res.isError) {
            notifications.error('norm', 'getAll', '')
            return
        }
        const { data } = res
        const stores = data.map(norm => new UserNormStore(norm))
        addLocalBulk(stores)
    }

    create = async () => {
        const payload = this.rootStore.draftStore.payload
        const res = await this.rootStore.fetchManager.create(payload)
        if (res.isError) {
            this.notifications.error('norm', 'save', payload.name)
            return
        }
        const { data } = res
        const store = this.rootStore.createChildStore(data)
        this.rootStore.addLocal({ store })
        this.rootStore.setCurrentId(data.id)
        this.notifications.success('norm', 'save', payload.name)
    }
}