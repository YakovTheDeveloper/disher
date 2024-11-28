import { DishAddOptions } from '@/components/blocks/Days/Day'
import { DayCategory } from '@/store/dayStore/rootDayStore'
import { rootDayStore, rootDishStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'
import { useNavigate, useNavigation, useSearchParams } from 'react-router-dom'
import s from './AddDishToDay.module.css'
import clsx from 'clsx'

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

    const onAdd = (dish: { id: string, name: string }) => {
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
                {userDishes.map(({ id, name }) => {
                    const isActive = isDishInCategory(dishAddCategory, id)
                    return (
                        <li key={id} onClick={() => onAdd({ id, name })} className={clsx(s.listItem, isActive && s.inList)}>
                            {name} <span>{isActive && '✅'}</span>

                        </li>
                    )
                })}
            </ul>
        </div>
    )
})

export default AddDishToDay