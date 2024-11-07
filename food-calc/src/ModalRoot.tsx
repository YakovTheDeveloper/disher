import ModalAuth from '@/components/ui/Modal/ModalAuth'
import ModalProduct from '@/components/ui/Modal/ModalProduct'
import { UIStore } from '@/store/rootStore'
import { Modals } from '@/store/uiStore/uiStore'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'





const ModalRoot = () => {

    const id = UIStore.currentModal

    return (
        <>
            <ModalAuth isOpen={id === Modals.Auth} />
            <ModalProduct isOpen={id === Modals.Product} />
        </>
    )
}

export default observer(ModalRoot)
