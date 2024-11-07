import { UIStore, userStore } from '@/store/rootStore'
import { Modals } from '@/store/uiStore/uiStore'
import { UserStore } from '@/store/userStore/userStore'
import React from 'react'

const Header = () => {

    const { openModal } = UIStore

    const onSignIn = () => openModal(Modals.Auth)

    return (
        <header>
            <button onClick={onSignIn}>
                Войти
            </button>
            <div>
                {userStore.user?.login}
            </div>
        </header>
    )
}

export default Header