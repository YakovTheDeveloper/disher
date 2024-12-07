import { rootDayStore2, rootDishStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import s from './AddDishToDay.module.css'
import clsx from 'clsx'
import { DayCategoryDish } from '@/types/day/day'
import { Typography } from '@/components/ui/Typography/Typography'
import { DayStore } from '@/store/rootDayStore/dayStore'
import DayDishesList from '@/components/blocks/Days/AddDishToDay/DayDishesList/DayDishesList'
import DishInCategoryStatus from '@/components/blocks/Days/DayCategoryDishItem/DishInCategoryStatus/DishInCategoryStatus'
import { DayStore2 } from '@/store/rootDayStore/dayStore2'
import { DayCategoryStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryStore'


type Props = {
    currentCategory: DayCategoryStore
}

const AddDishToDay = ({ currentCategory }: Props) => {
    const { toggleDish, isDishInCategory } = currentCategory

    const { userDishes } = rootDishStore

    console.log("currentCategory", currentCategory)

    const [isBlue, setIsBlue] = useState(false);

    useEffect(() => {
        setIsBlue(true);
        const timer = setTimeout(() => {
            setIsBlue(false);
        }, 150);
        return () => clearTimeout(timer);
    }, [currentCategory]);

    const onAdd = (dish: DayCategoryDish) => {
        toggleDish(dish)
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
                <DayDishesList
                    isDishInCategory={isDishInCategory}
                    toggleDishInCategory={onAdd}
                    userDishes={userDishes}
                    category={currentCategory}
                />
            </ul>
        </div>
    )
}

export default observer(AddDishToDay)