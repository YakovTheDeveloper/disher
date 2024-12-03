import Slider from '@/components/ui/Slider/Slider'
import { Typography } from '@/components/ui/Typography/Typography'
import { DayStore } from '@/store/rootDayStore/dayStore'
import { rootDayStore } from '@/store/rootStore'
import { debounce } from '@/utils/debounce'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useCallback, useState } from 'react'

type Props = {
    day: DayStore
    dishId: number
    dishCoefficient: number
}
const DayDishCoefficientSlider = ({ day, dishId, dishCoefficient }: Props) => {

    const [sliderValue, setSliderValue] = useState(0)

    if (!day?.currentCategory) return

    const { currentCategory } = day
    const categoryId = currentCategory.id
    const { updateDishCoefficient } = day

    const coefficient = dishCoefficient

    console.log("coefficient", coefficient)
    const category = toJS(day.map)
    console.log("coefficient category", category[categoryId].dishes[dishId], dishId)




    const debouncedUpdate = useCallback(
        debounce((newValue) => {
            updateDishCoefficient(categoryId, dishId, newValue);
        }, 300), // Adjust debounce delay as needed
        [categoryId, dishId]
    );

    const handleChange = (value: number) => {
        debouncedUpdate(value); // Debounced update for heavy operations
    };


    return (

        <Slider
            label={
                <Typography variant='caption'>
                    {coefficient.toFixed(1)} * 100 гр. = {(coefficient * 100).toFixed(1)} гр.
                </Typography>
            }
            onChange={handleChange}
            value={coefficient}
        />

    )
}

export default observer(DayDishCoefficientSlider)