import React from 'react'
import s from './NutrientValue.module.css'
import { CalculationStore } from '@/store/calculationStore/calculationStore'
import { NutrientCategory } from '@/store/nutrientStore/data'

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
        <div>{normaliseNutrientValue(value, nutrient)}</div>
    )
}

export default NutrientValue