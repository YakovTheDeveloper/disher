import { User } from "@/types/user/user"
import { makeAutoObservable } from "mobx"


export class UserStore {


    user: User | null = null

    setUser = (user: User) => {
        this.user = user
    }

    removeUser = () => {
        this.user = null
    }

    constructor() {
        makeAutoObservable(this)
    }




}
