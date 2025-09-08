import { Typography } from '@/components/ui/Typography/Typography'
import { DishStore } from '@/store/rootDishStore/dishStore/dishStore'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React from 'react'

type Props = {
  currentDish?: DishStore
  productId: number
}

const ProductInDishStatus = ({ productId, currentDish }: Props) => {
  if (!currentDish?.products) return null
  const { products } = currentDish

  const exist = products.some(({ id }) => id === productId)

  return (
    <Typography variant='caption' align='center'>
      {exist && 'В списке'}
    </Typography>
  )
}

export default observer(ProductInDishStatus)