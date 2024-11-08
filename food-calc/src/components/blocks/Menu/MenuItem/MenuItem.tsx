import React, { useEffect, useMemo, useRef, useState } from 'react'
import { calculationStore, rootMenuStore, productStore } from '../../../../store/rootStore'
import { IProductBase } from '../../../../types/menu/Menu'
import { IProduct, NutrientIdToQuantityMap } from '../../../../types/product/product'
import { observer } from 'mobx-react'
import { CalculationStore } from '@/store/calculationStore/calculationStore'
import { toJS } from 'mobx'


type Props = {
  product: IProductBase
  menuId: string
}

function MenuItem({ product, setProductQuantity, removeProduct }: Props) {

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Number(e.target.value)
    setProductQuantity(product.id, quantity)
  }

  return (
    <div>
      <p>{product.name}</p>
      <input type="text" value={product.quantity} onChange={onChange} />
      <button onClick={() => removeProduct(product.id)}>Удалить</button>
    </div>
  )
}

export default observer(MenuItem)