import { fetchSignIn, fetchSignUp } from "@/api/auth"
import { LoadingStateStore } from "@/store/common/LoadingStateStore"
import { User } from "@/types/user/user"
import { makeAutoObservable } from "mobx"


export class UserStore {

    constructor() {
        makeAutoObservable(this)
    }

    user: User | null = null

    setUser = (user: User) => {
        this.user = user
    }

    removeUser = () => {
        this.user = null
    }

    loadingState = new LoadingStateStore()

    fetchAuth = async (userData: any, variant: 'signIn' | 'signUp') => {
        const fetch = variant === 'signIn' ? fetchSignIn : fetchSignUp

        this.loadingState.setLoading('all', true)
        const res = await fetch(userData)
        if (res.isError) {
            this.loadingState.setLoading('all', false)
            return

        }
        this.loadingState.setLoading('all', false)
        return res.data
    }

}
