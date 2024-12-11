import Slider from '@/components/ui/Slider/Slider'
import { Typography } from '@/components/ui/Typography/Typography'
import { DayStore } from '@/store/rootDayStore/dayStore'
import { rootDayStore } from '@/store/rootStore'
import { debounce } from '@/utils/debounce'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useCallback, useContext, useState } from 'react'
import s from './DayDishCoefficientSlider.module.css'
import { dayCategoryDishStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryDishStore'
import { DayCalculationContext } from '@/context/calculationContext'

type Props = {
    categoryDish: dayCategoryDishStore
    coefficient: number
}


const getDescriptionLabelText = (coefficient: number) => {
    return `${coefficient.toFixed(1)} * 100 гр. = ${(coefficient * 100).toFixed(1)} гр`
}

const DayDishCoefficientSlider = ({ categoryDish, coefficient }: Props) => {
    const [localValue, setLocalValue] = useState(coefficient);

    const { updateCoefficient } = categoryDish
    const { updateCalculations } = useContext(DayCalculationContext)

    const debouncedUpdate = useCallback(
        debounce((newValue) => {
            updateCoefficient(newValue);
            updateCalculations()
        }, 300), // Adjust debounce delay as needed
        [categoryDish]
    );

    const handleChange = (value: number) => {
        debouncedUpdate(value); // Debounced update for heavy operations
        setLocalValue(value)
    };


    return (

        <Slider
            className={s.dishCoefficientSlider}
            label={
                <Typography variant='caption'>
                    {getDescriptionLabelText(coefficient)}
                </Typography>
            }
            onChange={handleChange}
            value={localValue}
        />

    )
}

export default observer(DayDishCoefficientSlider)