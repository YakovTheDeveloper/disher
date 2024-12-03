import React, { useCallback } from 'react'
import s from './DayCategoryDishList.module.css'
import { DayCategory, DayCategoryDish } from '@/types/day/day'
import DayCategoryDishItem from '@/components/blocks/Days/DayCategoryDishItem/DayCategoryDishItem'
import { Typography } from '@/components/ui/Typography/Typography'
import Slider from '@/components/ui/Slider/Slider'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import DayDishCoefficientSlider from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayDishCoefficientSlider/DayDishCoefficientSlider'
import { observable } from 'mobx'

type Props = {
    category: DayCategory
    getDishCoefficient: (categoryId: number, dishId: number) => number
    updateDishCoefficient: (categoryId: number, dishId: number, value: number) => void
    removeDishFromCategory: (categoryId: string, dish: DayCategoryDish) => void
    children: React.ReactNode
    dishSliderRender: (dishId: number) => React.ReactNode
}

const DayCategoryDishList = ({ category, dishSliderRender, removeDishFromCategory, getDishCoefficient, updateDishCoefficient }: Props) => {
    const categoryId = category.id.toString()


    return (

        <ul className={s.dishesList}>
            {category.dishes.map((dish) => {
                // const coefficient = getDishCoefficient(categoryId, dish.id);
                return (
                    <DayCategoryDishItem key={dish.id} className={s.dish} dish={dish}>
                        <RemoveButton
                            className={clsx(s.hoverShow, s.removeButton)}
                            onClick={observable(() => removeDishFromCategory(categoryId, dish))}
                            size='small'
                        />
                        <div className={s.sliderContainer}>
                            {dishSliderRender(dish.id)}
                            {/* <Slider
                                label={
                                    <Typography variant='caption'>
                                        {coefficient.toFixed(1)} * 100 гр. = {(coefficient * 100).toFixed(1)} гр.
                                    </Typography>
                                }
                                onChange={(value) => updateDishCoefficient(categoryId, dish.id, value)}
                                value={coefficient}
                            /> */}
                        </div>
                    </DayCategoryDishItem>
                );
            })}
        </ul>
    )
}

export default observer(DayCategoryDishList)