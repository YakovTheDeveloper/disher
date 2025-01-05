import { isEmpty } from "@/lib/empty";
import { initProducts } from "@/store/productStore/initProducts";
import { RootProductStore, UserProductStore } from "@/store/productStore/rootProductStore";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { autorun, makeAutoObservable, runInAction, toJS } from "mobx";

export class ProductFlow {
    constructor(
        private root: RootProductStore,
        private notification: NotificationStore
    ) {
        makeAutoObservable(this)

        autorun(() => {
            root.addLocalBulk(initProducts.map(product => new UserProductStore(product)))
            // root.fetchManager.getAll()
            //     .then(res => {
            //         if (res.isError) return
            //         rootProductStore.addLocalBulk(res.data.map(product => new UserProductStore(product)))
            //     })
        })
    }

    updatePart = async () => {
        const { currentStore } = this.root
        if (!currentStore) return
        const { payload, id } = currentStore
        const res = await this.root.fetchManager.update(id, payload)
        if (res.isError) {
            this.notification.error('product', "update", payload.name)
            return
        }
        this.notification.success('product', "update", payload.name)

    }

    getProductFull = async (ids: number[]) => {
        const { userStoresMap, getMissingProductIds } = this.root
        const missing = getMissingProductIds(ids)
        console.log("missing", userStoresMap)
        console.log("missing", missing, toJS(userStoresMap))
        if (isEmpty(missing)) {
            return { isError: false }
        }

        const res = await this.root.fetchManager.fetchById(ids)
        if (res.isError) {
            return res
        }

        res.data.forEach(({ id, nutrients, portions }) => {
            const { setPortions, setNutrients } = userStoresMap[id]
            runInAction(() => {
                setNutrients(nutrients)
                setPortions(portions)
            })
        })

    }
}