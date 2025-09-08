import NutrientsList from '@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList'
import ProductsPortions from '@/components/blocks/Products/ProductsMain/ProductsPortions/ProductsPortions'
import InputNumber from '@/components/ui/Input/InputNumber'
import { Typography } from '@/components/ui/Typography/Typography'
import { defaultNutrients } from '@/store/nutrientStore/data'
import { ProductStore } from '@/store/productStore/rootProductStore'
import React, { ReactNode } from 'react'
import s from './ProductsMain.module.css'
import { observer } from 'mobx-react-lite'
import Input from '@/components/ui/Input/Input'

type Props = {
    store: ProductStore
    children: ReactNode
}
const ProductsMain = ({ store, children }: Props) => {

    const { nutrients, updateNutrients, portions, addPortion, removePortion, name, updateName } = store

    return (
        <div className={s.productsMain}>
            <div className={s.productsMainContent}>
                <div className={s.column}>
                    <ProductsPortions
                        portions={portions}
                        addPortion={addPortion}
                        removePortion={removePortion}
                    />
                    <Input value={name} onChange={(e) => updateName(e.target.value)} />
                </div>
                <div className={s.nutrients}>
                    <NutrientsList

                        rowPositionSecond={(category) => (
                            <InputNumber
                                disabled
                                value={nutrients[category.id]}
                                onChange={(value) => updateNutrients(category.id, value)}
                            />
                        )}
                    />
                </div>
            </div>
            {children}
        </div>
    )
}

export default observer(ProductsMain)