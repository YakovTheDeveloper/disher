import { fetchGetMe } from "@/api/auth";
import { addTokenToLocalStorage } from "@/lib/storage/localStorage";
import { Flows } from "@/store/rootStore";
import { DishFlow } from "@/store/useCasesStore/dishFlow";
import { UserStore } from "@/store/userStore/userStore";
import { autorun, makeAutoObservable, reaction } from "mobx";

export class InitSetupFlow {


    constructor(private userStore: UserStore, private flows: typeof Flows) {
        makeAutoObservable(this)

        autorun(() => {
            fetchGetMe().then(res => {
                if (res.isError) return
                this.userStore.setUser(res.data)
            })
        })

        reaction(() => this.userStore.user, (user) => {
            if (!user) return
            const { Norm, Dish } = this.flows
            Dish.getAll()
            Norm.getAll()
        })
    }




}