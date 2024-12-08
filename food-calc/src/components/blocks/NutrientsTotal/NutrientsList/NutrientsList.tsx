import { NutrientCategory, nutrientsMap, nutrientsPadding } from '@/store/nutrientStore/data'
import React from 'react'
import s from './NutrientsList.module.css'
import clsx from 'clsx'
import { Typography } from '@/components/ui/Typography/Typography'
import { div } from 'framer-motion/client'
import { observer } from 'mobx-react-lite'
type Props = {
    rowPositionSecond?: React.ReactNode | ((cat: NutrientCategory) => JSX.Element);
    rowPositionThird?: React.ReactNode | ((cat: NutrientCategory) => JSX.Element);
    wrap?: boolean
}

const nutrientCategories = Object.values(nutrientsMap);
const nutrientPadding = (nutrientId: number): boolean => {
    return nutrientsPadding[nutrientId]
}

const NutrientsList = ({ rowPositionThird, rowPositionSecond, wrap }: Props) => {
    let nutrients = nutrientCategories
    let second = null
    if (wrap) {
        const first = nutrientCategories.slice(0, nutrientCategories.length / 2)
        nutrients = first
        second = nutrientCategories.slice(nutrientCategories.length / 2, nutrientCategories.length)
    }
    const gridClass = !rowPositionThird ? s.twoColumns : null
    return (
        <div className={s.nutrientsListContainer}>
            <ul className={s.nutrientsList}>
                {nutrients.map((category) => (
                    <li key={category.id} className={clsx([s.nutrient, gridClass])}>
                        <span className={clsx(nutrientPadding(category.id) ? s.offset : null)}>{category.displayNameRu}</span>
                        <span>
                            {rowPositionSecond instanceof Function
                                ? rowPositionSecond(category)
                                : rowPositionSecond}

                            {" "}
                            <Typography variant="caption">
                                {category.unitRu}
                            </Typography>
                        </span>
                        {rowPositionThird instanceof Function
                            ? rowPositionThird(category)
                            : rowPositionThird}
                    </li>
                ))}

            </ul>
            {second && <ul>
                {second.map((category) => (
                    <li key={category.id} className={clsx([s.nutrient, gridClass])}>
                        <span className={clsx(nutrientPadding(category.id) ? s.offset : null)}>{category.displayNameRu}</span>
                        <span>
                            {rowPositionSecond instanceof Function
                                ? rowPositionSecond(category)
                                : rowPositionSecond}

                            {" "}
                            <Typography variant="caption">
                                {category.unitRu}
                            </Typography>
                        </span>
                        {rowPositionThird instanceof Function
                            ? rowPositionThird(category)
                            : rowPositionThird}
                    </li>
                ))}
            </ul>}
        </div>
    )
}

export default observer(NutrientsList)