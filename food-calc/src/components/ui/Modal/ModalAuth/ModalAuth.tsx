import { fetchSignIn, fetchSignUp } from '@/api/auth'
import Button from '@/components/ui/Button/Button'
import Input from '@/components/ui/Input/Input'
import Modal from '@/components/ui/Modal/Modal'
import { Typography } from '@/components/ui/Typography/Typography'
import { addTokenToLocalStorage } from '@/lib/storage/localStorage'
import { uiStore, userStore } from '@/store/rootStore'
import { UiStore } from '@/store/uiStore/uiStore'
import React, { useEffect, useRef, useState } from 'react'
import s from './ModalAuth.module.css'
import { UserStore } from '@/store/userStore/userStore'
import { observer } from 'mobx-react-lite'
import { Tab } from '@/store/uiStore/modalStore/modalStore'

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


const SwitchTabText = {
    [Tab.SignUp]: {
        label: 'У меня уже есть профиль',
        button: 'Войти'
    },
    [Tab.SignIn]: {
        label: 'Нет профиля?',
        button: 'Создать'
    },
}

const Title = {
    [Tab.SignUp]: 'Создать профиль',
    [Tab.SignIn]: 'Войти',
}

const PW_MAX_LENGTH = 50
const LOGIN_MAX_LENGTH = 40

type Props = {
    isOpen: boolean,
    data: {
        currentTab: Tab;
    }
    store: UserStore
}

const ModalAuth = ({ isOpen, store = userStore, data }: Props) => {


    const [tab, setTab] = useState<Tab>(data.currentTab)
    const formRef: React.RefObject<HTMLFormElement> = useRef(null)
    console.log("data", data.currentTab, tab)

    useEffect(() => {
        setTab(data.currentTab)
    }, [data.currentTab])


    const { fetchAuth, loadingState } = store

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!formRef.current) return

        const formData = new FormData(formRef.current)
        const payload = [...formData].reduce((acc, [key, value]) => {
            acc[key] = value
            return acc
        }, {})
        fetchAuth(payload, tab).then(res => {
            if (!res) return
            addTokenToLocalStorage(res.access_token)
            userStore.setUser(res)
            uiStore.modal.closeModal()
        })
    }

    const toggleTab = () => {
        tab === Tab.SignIn ? setTab(Tab.SignUp) : setTab(Tab.SignIn)
    }

    const disabled = loadingState.getLoading('all')

    return (
        <Modal isOpen={isOpen} className={s.modal}>
            <Typography
                variant='h1'
                offset
                align='center'
            >
                {Title[tab]}
            </Typography>
            <form
                action=""
                onSubmit={onSubmit}
                ref={formRef}
                className={s.form}
            >
                <div className={s.inputs}>
                    <Input
                        type="text"
                        name={Inputs.Login} placeholder={Placeholders.Login} maxLength={LOGIN_MAX_LENGTH} />
                    <Input
                        type="password"
                        showPasswordToggle
                        name={Inputs.Password} placeholder={Placeholders.Password} maxLength={PW_MAX_LENGTH} />
                    {tab === 'signUp' && <Input type="password" showPasswordToggle name={Inputs.ConfirmPassword} placeholder={Placeholders.ConfirmPassword} maxLength={PW_MAX_LENGTH} />}
                </div>
                <Typography>
                    {SwitchTabText[tab].label}
                    <Button variant='ghost' onClick={toggleTab}>
                        {SwitchTabText[tab].button}
                    </Button>
                </Typography>
                <Button type='submit' disabled={disabled}>
                    Подтвердить
                </Button>
            </form>
        </Modal>
    )
}

export default observer(ModalAuth)