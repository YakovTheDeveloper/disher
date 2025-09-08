import Button from '@/components/ui/Button/Button'
import { Typography } from '@/components/ui/Typography/Typography'
import { uiStore } from '@/store/rootStore'
import { Modals, Tab } from '@/store/uiStore/modalStore/modalStore'
import { observer } from 'mobx-react-lite'
import React from 'react'

const AuthNeeded = ({ modal = uiStore.modal }) => {

    const onCreateProfile = () => {
        modal.openModal(Modals.Auth, { currentTab: Tab.SignUp });
    }

    return (
        <div>
            <Typography variant='h1' offset>Ваши дни</Typography>
            <Typography variant='body1'>Здесь можно составлять рацион</Typography>
            <Typography variant='body1'>
                <Button variant='ghost' onClick={onCreateProfile}>Создайте</Button> профиль, чтобы добавлять свои дни
            </Typography>

        </div>
    )
}

export default observer(AuthNeeded)