import { fetchSignIn, fetchSignUp } from '@/api/auth'
import Modal from '@/components/ui/Modal/Modal'
import { addTokenToLocalStorage } from '@/lib/storage/localStorage'
import { uiStore, userStore } from '@/store/rootStore'
import { UiStore } from '@/store/uiStore/uiStore'
import React, { useRef, useState } from 'react'


enum Inputs {
    Login = 'login',
    Password = 'password',
    ConfirmPassword = 'confirmPassword',
}

enum Placeholders {
    Login = 'Имя пользователя',
    Password = 'Пароль',
    ConfirmPassword = 'Подтвердите пароль',
}

enum Tab {
    SignIn = 'signIn',
    SignUp = 'signUp'
}

const PW_MAX_LENGTH = 50
const LOGIN_MAX_LENGTH = 40

const ModalAuth = ({ isOpen }) => {
    const [tab, setTab] = useState<Tab>(Tab.SignIn)
    const formRef: React.RefObject<HTMLFormElement> = useRef(null)

    const fetchStrategy = tab === Tab.SignIn ? fetchSignIn : fetchSignUp

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!formRef.current) return
        const formData = new FormData(formRef.current)
        const payload = [...formData].reduce((acc, [key, value]) => {
            acc[key] = value
            return acc
        }, {})
        fetchStrategy(payload).then(res => {
            if (!res) return
            addTokenToLocalStorage(res.access_token)
            userStore.setUser(res)
            uiStore.modal.closeModal()
        })


    }


    return (
        <Modal isOpen={isOpen}>
            <div>
                <button onClick={() => setTab(Tab.SignIn)}>Войти</button>
                <button onClick={() => setTab(Tab.SignUp)}>Создать профиль</button>
            </div>
            <form action="" onSubmit={onSubmit} ref={formRef}>
                <input type="text" name={Inputs.Login} placeholder={Placeholders.Login} maxLength={LOGIN_MAX_LENGTH} />
                <input type="password" name={Inputs.Password} placeholder={Placeholders.Password} maxLength={PW_MAX_LENGTH} />
                {tab === 'signUp' && <input type="password" name={Inputs.ConfirmPassword} placeholder={Placeholders.ConfirmPassword} maxLength={PW_MAX_LENGTH} />}
                <button>
                    Подтвердить
                </button>
            </form>
        </Modal>
    )
}

export default ModalAuth