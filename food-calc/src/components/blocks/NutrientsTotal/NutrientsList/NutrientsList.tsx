import { defaultNutrients, NutrientCategory, nutrientsMap, nutrientsPadding } from '@/store/nutrientStore/data'
import React from 'react'
import s from './NutrientsList.module.css'
import clsx from 'clsx'
import { Typography } from '@/components/ui/Typography/Typography'
import { div } from 'framer-motion/client'
import { observer } from 'mobx-react-lite'
import { NutrientData } from '@/types/nutrient/nutrient'
type Props = {
    rowPositionSecond?: React.ReactNode | ((cat: NutrientData) => JSX.Element);
    rowPositionThird?: React.ReactNode | ((cat: NutrientData) => JSX.Element);
    rowPositionFourth?: React.ReactNode | ((cat: NutrientData) => JSX.Element);
    wrap?: boolean
}

const nutrientPadding = (nutrientId: number): boolean => {
    return nutrientsPadding[nutrientId]
}

const NutrientsList = ({ rowPositionThird, rowPositionSecond, wrap }: Props) => {
    let nutrients = defaultNutrients

    let second = null
    if (wrap) {
        const first = defaultNutrients.slice(0, defaultNutrients.length / 2)
        nutrients = first
        second = defaultNutrients.slice(defaultNutrients.length / 2, defaultNutrients.length)
    }
    const gridClass = !rowPositionThird ? s.twoColumns : null
    return (
        <div className={s.nutrientsListContainer}>
            <ul className={s.nutrientsList}>
                {nutrients.map((category) => (
                    <li key={category.id} className={clsx([s.nutrient, gridClass])}>
                        <span className={clsx(nutrientPadding(category.id) ? s.offset : null)}>
                            {category.displayNameRu}</span>
                        <span className={s.cell}>
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
            {second && <ul className={s.nutrientsList}>
                {second.map((category) => (
                    <li key={category.id} className={clsx([s.nutrient, gridClass])}>
                        <span className={clsx(nutrientPadding(category.id) ? s.offset : null)}>{category.displayNameRu}</span>
                        <span className={s.cell}>
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