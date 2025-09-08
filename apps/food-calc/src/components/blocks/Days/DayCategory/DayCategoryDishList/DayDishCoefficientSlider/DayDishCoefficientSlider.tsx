import Slider from '@/components/ui/Slider/Slider'
import { Typography } from '@/components/ui/Typography/Typography'
import { dayCategoryDishStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryDishStore'
import { debounce } from '@/utils/debounce'
import { observer } from 'mobx-react-lite'
import React, { useCallback, useContext, useState } from 'react'
import s from './DayDishCoefficientSlider.module.css'
import { DayCalculationContext } from '@/context/calculationContext'

type Props = {
    categoryDish: dayCategoryDishStore
    quantity: number
}

const getDescriptionLabelText = (quantity: number) => {
    return `${(quantity * 100).toFixed(1)} гр`
}

const DayDishCoefficientSlider = ({ categoryDish, quantity }: Props) => {
    const [localValue, setLocalValue] = useState(quantity)

    const { updateQuantity } = categoryDish
    const { updateCalculations } = useContext(DayCalculationContext)

    const debouncedUpdate = useCallback(
        debounce((newValue) => {
            updateQuantity(newValue) // Update the quantity
            updateCalculations() // Perform heavy calculations
        }, 300), // Adjust debounce delay as needed
        [categoryDish]
    )

    const handleChange = (value: number) => {
        setLocalValue(value) // Update UI immediately
        debouncedUpdate(value) // Debounced heavy operation
    }

    return (
        <Slider
            className={s.dishCoefficientSlider}
            label={
                <Typography variant="caption">
                    {getDescriptionLabelText(localValue)} {/* Use localValue for real-time updates */}
                </Typography>
            }
            onChange={handleChange}
            value={localValue}
        />
    )
}

export default observer(DayDishCoefficientSlider)
