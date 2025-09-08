import React from 'react'
import s from './AuthButton.module.css'
import { modalStore, uiStore, userStore } from '@/store/rootStore'
import { Modals, Tab } from '@/store/uiStore/modalStore/modalStore'
import Button from '@/components/ui/Button/Button'
import { observer } from 'mobx-react-lite'
import { Tooltip } from '@/components/ui/Tooltip/Tooltip'
import RemoveTooltip from '@/components/blocks/common/RemoveTooltip/RemoveTooltip'
import { getTokenFromLocalStorage, removeTokenFromLocalStorage } from '@/lib/storage/localStorage'

const AuthButton = ({ modal = modalStore }) => {

    const { user } = userStore

    console.log('GG', modalStore)
    console.log('GG', modalStore.currentModal)

    const onClick = () => {
        if (user) {
            removeTokenFromLocalStorage()
            return window.location.reload()
        }
        modal.openModal(Modals.Auth, {
            currentTab: Tab.SignIn
        });
    }

    const text = user ? 'Выйти' : 'Войти'

    if (!user) {
        return (
            <Button variant='ghost' className={s.authButton} onClick={onClick}>
                {text}
            </Button>
        )
    }

    return (
        <Tooltip>
            <RemoveTooltip
                onConfirm={onClick}
            >
                <Button variant='ghost' className={s.authButton}  >
                    {text}
                </Button>
            </RemoveTooltip>
        </Tooltip>
    )
}

export default observer(AuthButton)
