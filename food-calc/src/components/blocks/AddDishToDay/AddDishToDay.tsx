import { DishAddOptions } from '@/components/blocks/Days/Day'
import { DayCategory } from '@/store/rootDayStore/rootDayStore'
import { rootDayStore, rootDishStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'
import { useNavigate, useNavigation, useSearchParams } from 'react-router-dom'
import s from './AddDishToDay.module.css'
import clsx from 'clsx'
import { DayCategoryDish } from '@/types/day/day'

type Props = {
    addDishToCategory: any
    dishAddCategory: DayCategory
    isDishInCategory: any
    currentCategoryId: string
    toggleDish: any
}

const AddDishToDay = observer((props: Props) => {

    const { addDishToCategory, dishAddCategory, isDishInCategory, currentCategoryId, toggleDish } = props
    const { userDishes } = rootDishStore

    const { name, dishes, id: categoryId } = dishAddCategory

    const [isBlue, setIsBlue] = useState(false);

    useEffect(() => {
        setIsBlue(true);
        const timer = setTimeout(() => {
            setIsBlue(false);
        }, 150);
        return () => clearTimeout(timer);
    }, [currentCategoryId]);

    const onAdd = (dish: DayCategoryDish) => {
        toggleDish(categoryId, {
            ...dish,
            position: 0
        })
    }

    return (
        <div className={clsx([
            s.container,
            isBlue ? s.appear : ''
        ])}>
            <p>{name}: добавить или убрать блюдо</p>
            <ul className={s.list}>
                {userDishes.map((dish) => {
                    const isActive = isDishInCategory(dishAddCategory, dish.id)
                    return (
                        <li key={dish.id} onClick={() => onAdd({
                            coefficient: 1,
                            id: dish.id,
                            name: dish.name,
                            products: dish.products.map(({ id, quantity }) => ({ id: +id, quantity }))
                        })} className={clsx(s.listItem, isActive && s.inList)}>
                            {name} <span>{isActive && '✅'}</span>

                        </li>
                    )
                })}
            </ul>
        </div>
    )
})

export default AddDishToDay