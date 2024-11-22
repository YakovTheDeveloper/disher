import { DishAddOptions } from '@/components/blocks/Days/Day'
import { DayCategory } from '@/store/dayStore/rootDayStore'
import { rootDayStore, rootMenuStore } from '@/store/rootStore'
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
}

const AddDishToDay = observer((props: Props) => {

    const { addDishToCategory, dishAddCategory, isDishInCategory, currentCategoryId } = props
    const { menus } = rootMenuStore

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
        addDishToCategory(categoryId, {
            ...dish,
            position: 0
        })
    }

    return (
        <div className={clsx([
            s.container,
            isBlue ? s.appear : ''
        ])}>
            <p>Добавить блюдо в категорию {name}</p>
            <ul>
                {menus.map(({ id, name }) => (
                    <li key={id} onClick={() => onAdd({ id, name })}>
                        {id}, {name} {isDishInCategory(dishAddCategory, id) && 'In List'}
                    </li>
                ))}
            </ul>
            {/* <button onClick={() => onAdd(id)}>Добавить</button> */}
        </div>
    )
})

export default AddDishToDay