import { fetchGetRichNutrientProducts } from '@/api/product'
import NutrientPercent from '@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent'
import NutrientValue from '@/components/blocks/NutrientsTotal/NutrientValue/NutrientValue'
import Modal from '@/components/ui/Modal/Modal'
import { Typography } from '@/components/ui/Typography/Typography'
import { RichProducts } from '@/store/productStore/productStore'
import { Flows, rootDailyNormStore } from '@/store/rootStore'
import { NutrientData, NutrientName } from '@/types/nutrient/nutrient'
import { RichProductData } from '@/types/product/product'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import s from './ModalRichNutrientProduct.module.css'
import RichNutrientProduct from '@/components/ui/Modal/ModalRichNutrientProduct/RichNutrientProduct/RichNutrientProduct'

type Props = {
    nutrient: NutrientData | null
    isOpen: boolean
    products: RichProducts
    getData: (nutrient: NutrientName) => void
    before: React.ReactNode
    loader: React.ReactNode
}

const ModalRichNutrientProduct = ({ nutrient, before, isOpen, products, getData, loader }: Props) => {

    useEffect(() => {
        if (!nutrient) return
        getData(nutrient.name)
    }, [nutrient])

    if (!nutrient) return null

    return (
        <Modal isOpen={isOpen}>
            <header className={s.header}>
                <Typography variant='h1'>{nutrient.displayNameRu}</Typography>
                {before}
            </header>
            <ul className={s.richProductList}>
                {loader}
                {products[nutrient.name]?.map(({ id, name, nutrients }) => (
                    <RichNutrientProduct
                        key={name}
                        id={id}
                        name={name}
                        nutrients={nutrients}
                        nutrient={nutrient}
                        onProductAdd={() => Flows.Dish.addProduct({
                            id, name, quantity: 100, name: ''
                        })}
                    />
                ))}
            </ul>
        </Modal>
    )
}

export default observer(ModalRichNutrientProduct)