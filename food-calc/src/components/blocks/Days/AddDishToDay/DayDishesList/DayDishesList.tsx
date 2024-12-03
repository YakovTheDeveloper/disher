import { UserDishStore } from '@/store/rootDishStore/dishStore/dishStore'
import React, { useEffect } from 'react'
import s from './DayDishesList.module.css'
import { DayCategory, DayCategoryDish } from '@/types/day/day'
import clsx from 'clsx'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import DishInCategoryStatus from '@/components/blocks/Days/DayCategoryDishItem/DishInCategoryStatus/DishInCategoryStatus'

type Props = {
    userDishes: UserDishStore[]
    isDishInCategory: (category: DayCategory, dishId: string) => boolean
    toggleDishInCategory: (dish: DayCategoryDish) => void
    category: DayCategory
}

const DayDishesList = ({ userDishes, isDishInCategory, toggleDishInCategory }: Props) => {



    return (
        <ul className={s.list}>
            {userDishes.map((dish) => {
                return (
                    <li
                        key={dish.id}
                        onClick={() => toggleDishInCategory({
                            coefficient: 1,
                            id: dish.id,
                            name: dish.name,
                            products: dish.products.map(({ id, quantity }) => ({ id: +id, quantity }))
                        })}
                        className={clsx(s.dayDishItem)}
                    >
                        {dish.name}
                        <DishInCategoryStatus
                            dishId={dish.id.toString()}
                            isDishInCategory={isDishInCategory}
                        />
                    </li>
                )
            })}
        </ul>
    )
}

export default observer(DayDishesList)