import ProductsPortions from '@/components/blocks/Products/ProductsMain/ProductsPortions/ProductsPortions'
import Modal from '@/components/ui/Modal/Modal'
import { RootDishStore } from '@/store/rootDishStore/rootDishStore'
import { observer } from 'mobx-react-lite'
import React from 'react'
import s from './ModalDishAdditionals.module.css'
import Textarea from '@/components/ui/Textarea/Textarea'
import { Typography } from '@/components/ui/Typography/Typography'

type Props = {
  isOpen: boolean
  rootDishStore: RootDishStore
}

const ModalDishAdditionals = ({ isOpen, rootDishStore }: Props) => {

  const { currentStore } = rootDishStore
  if (!currentStore) return null
  const { portionStore, description, updateDescription } = currentStore

  return (
    <Modal isOpen={isOpen} className={s.modalDishAdditionals}>
      <Typography variant='caption' align='center'>
        Описание блюда
      </Typography>
      <Textarea value={description} onChange={(value) => updateDescription(value)} placeholder='Особенности блюда' />
      <Typography variant='caption' align='center'>
        Порции
      </Typography>
      <ProductsPortions className={s.portions} portions={portionStore.portions} addPortion={portionStore.addPortion} removePortion={portionStore.removePortion} />

    </Modal>
  )
}

export default observer(ModalDishAdditionals)