import React from 'react'
import s from './DayCategoryDishList.module.css'
import { DayCategory, DayCategoryDish } from '@/types/day/day'
import DayCategoryDishItem from '@/components/blocks/Days/DayCategoryDishItem/DayCategoryDishItem'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { observable } from 'mobx'
import { dayCategoryDishStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryDishStore'
import DayDishCoefficientSlider from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayDishCoefficientSlider/DayDishCoefficientSlider'

type Props = {
    // category: DayCategory
    // getDishCoefficient: (categoryId: number, dishId: number) => number
    // updateDishCoefficient: (categoryId: number, dishId: number, value: number) => void
    // removeDishFromCategory: (categoryId: string, dish: DayCategoryDish) => void
    // children: React.ReactNode
    // dishSliderRender: (dishId: number) => React.ReactNode



    dishes: dayCategoryDishStore[]
    renderDeleleButton: (dishId: number) => React.ReactNode
}

const DayCategoryDishList = ({ dishes, renderDeleleButton }: Props) => {

    return (
        <ul className={s.dishesList}>
            {dishes.map((dish) => {
                return (
                    <DayCategoryDishItem key={dish.id} className={s.dish} dish={dish}
                        after={renderDeleleButton(dish.id)}>

                        <div className={s.sliderContainer}>
                            <DayDishCoefficientSlider
                                categoryDish={dish}
                                coefficient={dish.coefficient}
                            />
                        </div>
                    </DayCategoryDishItem>
                );
            })}
        </ul>
    )
}

export default observer(DayCategoryDishList)