import { UserDishStore } from '@/store/rootDishStore/dishStore/dishStore'
import React from 'react'
import s from './DayDishesList.module.css'

type Props = {
    userDishes: UserDishStore[]
}

const DayDishesList = ({ userDishes }: Props) => {
    return (
        <ul className={s.list}>
            {userDishes.map((dish) => {
                const isActive = isDishInCategory(dishAddCategory, dish.id)
                return (
                    <li
                        key={dish.id}
                        onClick={() => onAdd({
                            coefficient: 1,
                            id: dish.id,
                            name: dish.name,
                            products: dish.products.map(({ id, quantity }) => ({ id: +id, quantity }))
                        })}
                        className={clsx(s.listItem, isActive && s.inList)}
                    >
                        {dish.name} <span>{isActive && '✅'}</span>
                    </li>
                )
            })}
        </ul>
    )
}

export default DayDishesList