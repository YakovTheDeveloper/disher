import React from 'react'
import s from './DayCategoryDishList.module.css'
import { DayCategory, DayCategoryDish } from '@/types/day/day'
import DayCategoryDishItem from '@/components/blocks/Days/DayCategoryDishItem/DayCategoryDishItem'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { observable } from 'mobx'

type Props = {
    category: DayCategory
    getDishCoefficient: (categoryId: number, dishId: number) => number
    updateDishCoefficient: (categoryId: number, dishId: number, value: number) => void
    removeDishFromCategory: (categoryId: string, dish: DayCategoryDish) => void
    children: React.ReactNode
    dishSliderRender: (dishId: number) => React.ReactNode
}

const DayCategoryDishList = ({ category, dishSliderRender, removeDishFromCategory }: Props) => {
    const categoryId = category.id.toString()
    return (

        <ul className={s.dishesList}>
            {category.dishes.map((dish) => {
                return (
                    <DayCategoryDishItem key={dish.id} className={s.dish} dish={dish} after={
                        <RemoveButton
                            className={clsx(s.hoverShow, s.removeButton)}
                            onClick={observable(() => removeDishFromCategory(categoryId, dish))}
                            size='small'
                        />
                    }>

                        <div className={s.sliderContainer}>
                            {dishSliderRender(dish.id)}
                        </div>
                    </DayCategoryDishItem>
                );
            })}
        </ul>
    )
}

export default observer(DayCategoryDishList)