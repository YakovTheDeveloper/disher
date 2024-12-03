import { rootDishStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import s from './AddDishToDay.module.css'
import clsx from 'clsx'
import { DayCategoryDish } from '@/types/day/day'
import { Typography } from '@/components/ui/Typography/Typography'
import { DayStore } from '@/store/rootDayStore/dayStore'

type Props = {
    day: DayStore
}

const AddDishToDay = observer((props: Props) => {

    const { isDishInCategory, toggleDish, currentCategory } = props.day
    const { userDishes } = rootDishStore

    // const { name, id: categoryId } = dishAddCategory

    const [isBlue, setIsBlue] = useState(false);



    useEffect(() => {
        setIsBlue(true);
        const timer = setTimeout(() => {
            setIsBlue(false);
        }, 150);
        return () => clearTimeout(timer);
    }, [currentCategory]);

    const onAdd = (dish: DayCategoryDish) => {
        toggleDish(currentCategory?.id, {
            ...dish,
            position: 0
        })
    }

    if (!currentCategory) return null

    return (
        <div className={clsx([
            s.container,
            isBlue ? s.appear : ''
        ])}>
            <div className={s.header}>
                <Typography align='center'>{currentCategory?.name}</Typography>
                <Typography variant='caption' align='center'>добавить или убрать блюдо</Typography>
            </div>
            <ul className={s.list}>
                {userDishes.map((dish) => {
                    const isActive = isDishInCategory(currentCategory, dish.id.toString())
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
        </div>
    )
})

export default AddDishToDay