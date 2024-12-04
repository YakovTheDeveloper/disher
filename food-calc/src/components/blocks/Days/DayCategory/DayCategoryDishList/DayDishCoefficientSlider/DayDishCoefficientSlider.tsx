import Slider from '@/components/ui/Slider/Slider'
import { Typography } from '@/components/ui/Typography/Typography'
import { DayStore } from '@/store/rootDayStore/dayStore'
import { rootDayStore } from '@/store/rootStore'
import { debounce } from '@/utils/debounce'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useCallback, useState } from 'react'
import s from './DayDishCoefficientSlider.module.css'
type Props = {
    day: DayStore
    dishId: number
    coefficient: number
}


const getDescriptionLabelText = (coefficient: number) => {
    return `${coefficient.toFixed(1)} * 100 гр. = ${(coefficient * 100).toFixed(1)} гр`
}
const DayDishCoefficientSlider = ({ day, dishId, coefficient }: Props) => {
    const [localValue, setLocalValue] = useState(coefficient);


    if (!day?.currentCategory) return

    const { currentCategory } = day
    const categoryId = currentCategory.id
    const { updateDishCoefficient } = day



    const debouncedUpdate = useCallback(
        debounce((newValue) => {
            updateDishCoefficient(categoryId, dishId, newValue);
        }, 300), // Adjust debounce delay as needed
        [categoryId, dishId]
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