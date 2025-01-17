import { dishFlow, Flows, productStore, rootDishStore, uiStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import { ReactNode, useContext, useEffect, useState } from 'react'
import s from './AddDishToDay.module.css'
import clsx from 'clsx'
import { DayCategoryDish } from '@/types/day/day'
import { Typography } from '@/components/ui/Typography/Typography'
import DayDishesList from '@/components/blocks/Days/AddDishToDay/DayDishesList/DayDishesList'
import { DayCategoryStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryStore'
import { DayCalculationContext } from '@/context/calculationContext'
import Input from '@/components/ui/Input/Input'
import SearchInput from '@/components/ui/Input/SearchInput/SearchInput'
import DishSearch from '@/components/blocks/Dish/DishSearch/DishSearch'
import { DishUiStore } from '@/store/uiStore/dishUiStore/dishUiStore'
import Button from '@/components/ui/Button/Button'
import { useDishLoading, useDishSearch } from '@/components/blocks/Dish/hooks'


type Props = {
    currentCategory: DayCategoryStore
    before: ReactNode
    dishUiStore: DishUiStore
}

const AddDishToDay = ({ currentCategory, before, dishUiStore }: Props) => {
    const { toggleDish, isDishInCategory } = currentCategory

    const { userStores } = rootDishStore
    const { updateCalculations } = useContext(DayCalculationContext)

    const [isBlue, setIsBlue] = useState(false);

    useEffect(() => {
        setIsBlue(true);
        const timer = setTimeout(() => {
            setIsBlue(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [currentCategory]);

    const onAdd = (dish: DayCategoryDish) => {

        toggleDish(dish)

        Flows.Product.getProductFull(currentCategory.uniqueProductIds).then(
            (res) => {
                updateCalculations()
                if (res?.isError) {
                    toggleDish(dish)
                }
            }
        )
    }

    const { onReachEnd } = useDishLoading({
        dishFlow,
        dishUiStore
    })

    const { content, disabled } = useDishSearch({
        dishStores: userStores,
        dishUiStore,
        paginationStore: rootDishStore.pagination

    })

    if (!currentCategory) return null

    return (
        <div className={clsx([
            s.container,
            isBlue ? s.appear : ''
        ])}>
            <div className={s.header}>
                <div className={s.before}>
                    {before}
                </div>
                <div className={s.headerTitle}>
                    <Typography variant='h2' align='center'>{currentCategory?.name}</Typography>
                    <Typography variant='caption' align='center'>добавить или убрать блюдо</Typography>
                </div>
            </div>
            <DishSearch
                size='medium'
                getAll={dishFlow.getAll}
                uiStore={uiStore.dishUi}
                onChange={() => rootDishStore.pagination.reset()}
            />
            <ul className={s.list}>
                <DayDishesList
                    isDishInCategory={isDishInCategory}
                    toggleDishInCategory={onAdd}
                    userDishes={content}
                    category={currentCategory}
                />
            </ul>
            <Button onClick={onReachEnd} variant='ghost' disabled={disabled} center>
                Загрузить еще
            </Button>
        </div>
    )
}

export default observer(AddDishToDay)