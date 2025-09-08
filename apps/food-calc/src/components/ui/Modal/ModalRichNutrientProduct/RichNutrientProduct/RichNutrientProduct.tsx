import React, { useState } from 'react'
import s from './RichNutrientProduct.module.css'
import NutrientPercent from '@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent'
import { Typography } from '@/components/ui/Typography/Typography'
import { rootDailyNormStore, rootDishStore } from '@/store/rootStore'
import { IdToQuantity } from '@/types/common/common'
import { NutrientData } from '@/types/nutrient/nutrient'
import { observer } from 'mobx-react-lite'
import ProductInDishStatus from '@/components/blocks/Dish/ProductInDishStatus/ProductInDishStatus'
import clsx from 'clsx'

type Props = {
    id: number,
    name: string,
    nutrient: NutrientData
    nutrients: IdToQuantity
    onProductAdd: () => Promise<void>
}

const RichNutrientProduct = ({ id, name, nutrients, nutrient, onProductAdd }: Props) => {

    const [textColor, setTextColor] = useState('black')
    const [backgroundColor, setBackgroundColor] = useState('transparent')
    const [isHover, setIsHover] = useState(false)

    const onGetColorStyle = (color: string, backgroundColor: string) => {
        setTextColor(color)
        setBackgroundColor(backgroundColor)
    }

    const onMouseEnter = () => setIsHover(true)
    const onMouseLeave = () => setIsHover(false)

    const style = isHover ? {
        color: textColor,
        backgroundColor
    } : undefined

    const nutrientValue = nutrients[nutrient.id]

    return (
        <li
            className={clsx([s.richProduct, s.clickable])}
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onProductAdd}
        >
            <Typography variant='caption'>{nutrient.unitRu}</Typography>
            {nutrientValue}
            <div className={s.nameContainer}>
                <Typography variant='body1' className={s.name}>{name}</Typography>
            </div>
            <ProductInDishStatus productId={id} currentDish={rootDishStore.currentDish} />
            <NutrientPercent
                nutrientQuantity={nutrients[nutrient.id]}
                nutrient={nutrient}
                dailyNutrientNorm={rootDailyNormStore.currentDailyNormUsedInCalculations}
                getComponentColorStyle={onGetColorStyle}
            />
        </li>
    )
}

export default observer(RichNutrientProduct)