import React from 'react'
import s from './DayCategoryDishList.module.css'
import DayCategoryDishItem from '@/components/blocks/Days/DayCategoryDishItem/DayCategoryDishItem'
import { observer } from 'mobx-react-lite'
import { dayCategoryDishStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryDishStore'
import DayDishCoefficientSlider from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayDishCoefficientSlider/DayDishCoefficientSlider'
import { LoadingStateStore } from '@/store/common/LoadingStateStore'

type Props = {
    dishes: dayCategoryDishStore[]
    renderDeleleButton: (dishId: number) => React.ReactNode
    loadingStore: LoadingStateStore
}

const DayCategoryDishList = ({ dishes, renderDeleleButton, loadingStore }: Props) => {


    const checkLoading = (ids: number[]) => {
        const some = ids.some(id => loadingStore.getLoading('getOne', id) === true)
        return some
    }

    return (
        <ul className={s.dishesList}>
            {dishes.map((dish) => {
                return (
                    <DayCategoryDishItem key={dish.id} className={s.dish} dish={dish}
                        after={renderDeleleButton(dish.id)}>

                        <div className={s.sliderContainer}>
                            <DayDishCoefficientSlider
                                categoryDish={dish}
                                coefficient={dish.coefficient}
                            />
                        </div>
                        <div>
                            {checkLoading(dish.productIds) && 'LOADING'}
                        </div>
                    </DayCategoryDishItem>
                );
            })}
        </ul>
    )
}

export default observer(DayCategoryDishList)