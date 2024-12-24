import { defaultNutrients, defaultNutrientsV2, NutrientCategory, nutrientsMap, nutrientsPadding } from '@/store/nutrientStore/data'
import React, { useState } from 'react'
import s from './NutrientsList.module.css'
import clsx from 'clsx'
import { Typography } from '@/components/ui/Typography/Typography'
import { div } from 'framer-motion/client'
import { observer } from 'mobx-react-lite'
import { NutrientData, NutrientName } from '@/types/nutrient/nutrient'
export type NutrientsListProps = {
    rowPositionFirst?: React.ReactNode | ((cat: NutrientData) => JSX.Element | null);
    rowPositionSecond?: React.ReactNode | ((cat: NutrientData) => JSX.Element);
    rowPositionThird?: React.ReactNode | ((cat: NutrientData) => JSX.Element);
    rowPositionFourth?: React.ReactNode | ((cat: NutrientData) => JSX.Element);
    nutrients?: NutrientData[]
    nutrientsV2?: typeof defaultNutrientsV2
}

const nutrientPadding = (nutrientId: number): boolean => {
    return nutrientsPadding[nutrientId]
}

const NutrientsList = ({ rowPositionFirst, rowPositionThird, rowPositionSecond, nutrientsV2 = defaultNutrientsV2, nutrients = defaultNutrients }: NutrientsListProps) => {
    const gridClass = !rowPositionThird ? s.twoColumns : null
    return (
        <div className={s.nutrientsListContainer}>
            {Object.entries(nutrientsV2).map(([categoryName, categories]) => (
                <ul className={s.nutrientsList} key={categoryName}>
                    {categories.map((category) => (
                        <li
                            key={category.id}
                            className={clsx([s.nutrient, gridClass])}
                        >
                            <span className={s.cell}>
                                {rowPositionFirst instanceof Function
                                    ? rowPositionFirst(category)
                                    : rowPositionFirst
                                }
                                <Typography
                                    className={clsx(nutrientPadding(category.id) ? s.offset : null)}
                                    variant='table'
                                >
                                    {category.displayNameRu}
                                </Typography>
                            </span>
                            <span className={s.cell}>
                                {rowPositionSecond instanceof Function
                                    ? rowPositionSecond(category)
                                    : rowPositionSecond
                                }

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
            ))}
            {/* <ul className={s.nutrientsList}>
                {nutrients.map((category) => (
                    <li
                        key={category.id}
                        className={clsx([s.nutrient, gridClass])}
                    >
                        <span className={s.cell}>
                            {rowPositionFirst instanceof Function
                                ? rowPositionFirst(category)
                                : rowPositionFirst
                            }
                            <Typography
                                className={clsx(nutrientPadding(category.id) ? s.offset : null)}
                                variant='table'
                            >
                                {category.displayNameRu}
                            </Typography>
                        </span>
                        <span className={s.cell}>
                            {rowPositionSecond instanceof Function
                                ? rowPositionSecond(category)
                                : rowPositionSecond
                            }

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
            </ul> */}
        </div>
    )
}

export default observer(NutrientsList)