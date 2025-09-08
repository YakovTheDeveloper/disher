import ProductsPortions from '@/components/blocks/Products/ProductsMain/ProductsPortions/ProductsPortions'
import Modal from '@/components/ui/Modal/Modal'
import { RootDishStore } from '@/store/rootDishStore/rootDishStore'
import { observer } from 'mobx-react-lite'
import React from 'react'
import Textarea from '@/components/ui/Textarea/Textarea'
import { Typography } from '@/components/ui/Typography/Typography'
import s from './DishFormAdditionals.module.css'
import { DishUiStore } from '@/store/uiStore/dishUiStore/dishUiStore'
import { uiStore } from '@/store/rootStore'

type Props = {
    rootDishStore: RootDishStore
    uiDishStore: DishUiStore
}

const DishFormAdditionals = ({ rootDishStore, uiDishStore = uiStore.dishUi }: Props) => {

    const { currentStore } = rootDishStore
    if (!currentStore || !uiDishStore.additionalDishFormDataShow) return null
    const { portionStore, description, updateDescription, name } = currentStore

    console.log("description", name, description)
    return (
        <div key={currentStore.id} className={s.dishFormAdditionals}>
            <Typography variant='caption' align='center'>
                Описание блюда
            </Typography>
            <Textarea value={description} onChange={(value) => updateDescription(value)} placeholder='Особенности блюда' />
            <Typography variant='caption' align='center'>
                Порции
            </Typography>
            <ProductsPortions className={s.portions} portions={portionStore.portions} addPortion={portionStore.addPortion} removePortion={portionStore.removePortion} />

        </div>
    )
}

export default observer(DishFormAdditionals)