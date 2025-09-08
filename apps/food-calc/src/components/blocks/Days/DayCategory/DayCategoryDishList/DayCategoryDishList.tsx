import React from 'react'
import s from './DayCategoryDishList.module.css'
import { observer } from 'mobx-react-lite'
import { dayCategoryDishStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryDishStore'
import { LoadingStateStore } from '@/store/common/LoadingStateStore'
import DayCategoryDish from '@/components/blocks/Days/DayCategoryDish/DayCategoryDish'

type Props = {
    dishes: dayCategoryDishStore[]
    removeDish: (dishId: number) => void
    loadingStore: LoadingStateStore
}

const DayCategoryDishList = ({ dishes, loadingStore, removeDish }: Props) => {


    const checkLoading = (ids: number[]) => {
        const some = ids.some(id => loadingStore.getLoading('getOne', id) === true)
        return some
    }

    return (
        <ul className={s.dishesList}>
            {dishes.map((dish) => {
                return (
                    <DayCategoryDish
                        key={dish.id}
                        dish={dish}
                        isLoading={checkLoading(dish.productIds)}
                        removeDish={() => removeDish(dish.id)}
                    />
                );
            })}
        </ul>
    )
}

export default observer(DayCategoryDishList)