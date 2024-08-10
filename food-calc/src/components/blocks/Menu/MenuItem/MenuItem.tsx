import React, { useEffect, useMemo, useRef, useState } from 'react'
import { calculationStore, Menus, productStore } from '../../../../store/rootStore'
import { IProductBase } from '../../../../types/menu/Menu'
import { IProduct } from '../../../../types/product/product'
import { observer } from 'mobx-react'

type Props = {
  product: IProductBase
  menuId: string
}

const getNewCalculatedContent = (delta: number, content: IProduct['content']): IProduct['content'] => {
  const newContent = JSON.parse(JSON.stringify(content))

  for (const category in newContent) {
    const nutrients = newContent[category] as Record<string, number>
    for (const nutrient in nutrients) {
      const currentValue = nutrients[nutrient]
      newContent[category][nutrient] = currentValue * delta / 100
      console.log('changes',currentValue * delta / 100)
    }
  }

  return newContent

}

function MenuItem({ menuId, product }: Props) {

  const { changeMenuProductQuantity, menus } = Menus
  const { products } = productStore
  const { calculateNutrients } = calculationStore

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // console.log('last value: ', product.quantity)
    const quantity = Number(e.target.value)
    // console.log('new value: ', quantity)
    changeMenuProductQuantity(menuId, product.id, quantity)

  }

  const last = useRef(product.quantity)

  useEffect(() => {
    const delta = product.quantity - last.current
    console.log(delta)

    const calculated = getNewCalculatedContent(delta, products[product.id].content)

    calculateNutrients(calculated)
    last.current = product.quantity
  }, [product.quantity])





  return (
    <div>
      <p>{product.name}</p>
      <input type="text" value={product.quantity} onChange={onChange} />
      {/* {JSON.stringify(productDraft)} */}
    </div>
  )
}

export default observer(MenuItem)