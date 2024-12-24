import { UserDishStore } from '@/store/rootDishStore/dishStore/dishStore'
import React, { useEffect } from 'react'
import s from './DayDishesList.module.css'
import { DayCategory, DayCategoryDish } from '@/types/day/day'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import DishInCategoryStatus from '@/components/blocks/Days/DayCategoryDish/DishInCategoryStatus/DishInCategoryStatus'
import { Typography } from '@/components/ui/Typography/Typography'

type Props = {
    userDishes: UserDishStore[]
    isDishInCategory: (dishId: number) => boolean
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
                            quantity: 100,
                            id: dish.id,
                            name: dish.name,
                            products: dish.products.map(({ id, quantity }) => ({ id: +id, quantity }))
                        })}
                        className={clsx(s.dayDishItem)}
                    >
                        <Typography>{dish.name}</Typography>
                        <DishInCategoryStatus
                            isDishInCategory={isDishInCategory(dish.id)}
                        />
                    </li>
                )
            })}
        </ul>
    )
}

export default observer(DayDishesList)