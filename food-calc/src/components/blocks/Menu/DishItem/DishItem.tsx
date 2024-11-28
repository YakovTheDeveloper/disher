import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { calculationStore, rootDishStore, productStore } from '../../../../store/rootStore'
import { IProductBase } from '../../../../types/menu/Menu'
import { IProduct, NutrientIdToQuantityMap } from '../../../../types/product/product'
import { observer } from 'mobx-react'
import { CalculationStore } from '@/store/calculationStore/calculationStore'
import { toJS } from 'mobx'
import { ProductLoading } from '@/store/productStore/productStore'
import s from './DishProduct.module.css'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import clsx from 'clsx'

type Props = {
  product: IProductBase
  menuId: string
  isLoading: ProductLoading | null
}

function DishItem({ product, setProductQuantity, removeProduct, isLoading }: Props) {

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Number(e.target.value)
    setProductQuantity(product.id, quantity)
  }
  console.log('isLoading', toJS(isLoading))
  const disabled = isLoading?.isLoading || isLoading?.status === 'error' || isLoading?.status === 'pending'

  return (
    <div className={clsx([s.dishProduct, isLoading?.isLoading ? s.loading : ''])}>
      <p>{product.name}</p>
      <input maxLength={4} className={clsx(s.input)} type="text" value={product.quantity} onChange={onChange} disabled={disabled} />
      <RemoveButton onClick={() => removeProduct(product.id)} className={s.removeButton} />
    </div>
  )
}

export default memo(observer(DishItem))