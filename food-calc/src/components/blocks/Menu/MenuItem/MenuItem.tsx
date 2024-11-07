import React, { useEffect, useMemo, useRef, useState } from 'react'
import { calculationStore, rootMenuStore, productStore } from '../../../../store/rootStore'
import { IProductBase } from '../../../../types/menu/Menu'
import { IProduct, NutrientIdToQuantityMap } from '../../../../types/product/product'
import { observer } from 'mobx-react'
import { CalculationStore } from '@/store/calculationStore/calculationStore'
import { toJS } from 'mobx'



// const getNewCalculatedContent = (delta: number, content: IProduct['content']): IProduct['content'] => {
//   const newContent = JSON.parse(JSON.stringify(content))

//   for (const category in newContent) {
//     const nutrients = newContent[category] as Record<string, number>
//     for (const nutrient in nutrients) {
//       const currentValue = nutrients[nutrient]
//       newContent[category][nutrient] = currentValue * delta / 100
//       console.log('changes', currentValue * delta / 100)
//     }
//   }

//   return newContent

// }
const getNewCalculatedContent = (delta: number, baseProductNutrients: NutrientIdToQuantityMap): NutrientIdToQuantityMap => {
  const calculatedProductNutrients = { ...baseProductNutrients }

  for (const nutrientId in baseProductNutrients) {
    const baseQuantity = baseProductNutrients[nutrientId]

    calculatedProductNutrients[nutrientId] = baseQuantity * delta / 100
    console.log('changes', baseQuantity * delta / 100)
  }

  return calculatedProductNutrients

}


type Props = {
  product: IProductBase
  menuId: string
  calculations: CalculationStore
}

function MenuItem({ product, setProductQuantity, calculations }: Props) {


  const productNutrients = productStore.getProductNutrients(+product.id)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Number(e.target.value)
    setProductQuantity(product.id, quantity)
  }


  // const firstRender = useRef(true)

  useEffect(() => {
    console.log(product.quantity)
  }, [product.quantity])




  useEffect(() => {
    // calculations.calculateNutrients()
  }, [product.quantity])

  // useEffect(() => {
  //   console.log('RENDER []')
  //   firstRender.current = false
  // }, [])


  // if (!productNutrients) {
  //   return <div>loading...</div>
  // }

  console.log("product", toJS(product))

  return (
    <div>
      <p>{product.name}</p>
      <input type="text" value={product.quantity} onChange={onChange} />
      {/* {JSON.stringify(productDraft)} */}
    </div>
  )
}

export default observer(MenuItem)