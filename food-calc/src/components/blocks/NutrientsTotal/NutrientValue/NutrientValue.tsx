import React from 'react'
import s from './NutrientValue.module.css'
import { CalculationStore } from '@/store/calculationStore/calculationStore'
import { NutrientCategory } from '@/store/nutrientStore/data'
import { Typography } from '@/components/ui/Typography/Typography'

type Props = {
    nutrient: NutrientCategory
    calculations: CalculationStore
}

const normaliseNutrientValue = (value: number, nutrient: NutrientCategory) => {
    const { unit } = nutrient
    if (unit === 'μg') return value.toFixed(2)
    return value.toFixed(1)

}

const NutrientValue = ({ calculations, nutrient }: Props) => {
    const value = calculations.totalNutrients[nutrient.id]
    if (value == null) return null

    return (
        <Typography variant='body2'>{normaliseNutrientValue(value, nutrient)}</Typography>
    )
}

export default NutrientValue