import AuthButton from '@/components/ui/Button/AuthButton/AuthButton'
import { UIStore, userStore } from '@/store/rootStore'
import { Modals } from '@/store/uiStore/uiStore'
import { UserStore } from '@/store/userStore/userStore'
import React from 'react'
import s from './Header.module.css'

const Header = () => {

    const { openModal } = UIStore
    const { user } = userStore


    const onSignIn = () => openModal(Modals.Auth)

    return (
        <header className={s.header}>
            <AuthButton onClick={onSignIn}>
                Войти
            </AuthButton>
            <div>
                {user?.login}
            </div>
        </header>
    )
}

export default Header