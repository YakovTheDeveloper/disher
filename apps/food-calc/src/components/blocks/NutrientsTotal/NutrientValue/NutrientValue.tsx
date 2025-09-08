import React from 'react'
import s from './NutrientValue.module.css'
import { CalculationStore } from '@/store/calculationStore/calculationStore'
import { NutrientCategory } from '@/store/nutrientStore/data'
import { Typography } from '@/components/ui/Typography/Typography'

type Props = {
    nutrient: NutrientCategory
    calculations: CalculationStore
}

const removeTrailingZeroes = (str: string): string => {
    return str.replace(/(\.0+|(\.\d*?[1-9])0+)$/, '$2');
};

const normaliseNutrientValue = (value: number, nutrient: NutrientCategory): string => {
    const { unit } = nutrient;
    let result = '';
    if (unit === 'μg') {
        result = value.toFixed(2);
    } else {
        result = value.toFixed(1);
    }
    return removeTrailingZeroes(result);
};

const NutrientValue = ({ calculations, nutrient }: Props) => {
    const value = calculations.totalNutrients[nutrient.id]
    if (value == null) return null

    return (
        <Typography variant='body2'>
            {normaliseNutrientValue(value, nutrient)}
        </Typography>
    )
}

export default NutrientValue