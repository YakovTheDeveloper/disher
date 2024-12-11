import DayCategory from '@/components/blocks/Days/DayCategory/DayCategory'
import DayCategoryDishList from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayCategoryDishList'
import DayDishCoefficientSlider from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayDishCoefficientSlider/DayDishCoefficientSlider'
import DayCategoryDishItem from '@/components/blocks/Days/DayCategoryDishItem/DayCategoryDishItem'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { DayCalculationContext } from '@/context/calculationContext'

import { DayCategoryStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryStore'
import { productStore } from '@/store/rootStore'
import clsx from 'clsx'
import { Reorder, AnimatePresence } from 'framer-motion'
import { observable } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useContext } from 'react'

type Props = {
    categories: DayCategoryStore[]
    currentCategory: number

}
const DayCategories = ({ categories, currentCategory }: Props) => {

    const { updateCalculations } = useContext(DayCalculationContext);


    return (
        <AnimatePresence>
            {categories.map((category, index) => {
                console.log("OMG", currentCategory, category.id)
                return (
                    <DayCategory
                        key={category.id}
                        isActive={currentCategory === category.id}
                        category={category}
                        index={index}
                        renderDragHandle={true}
                        removeCategory={category.remove}
                    >
                        <DayCategoryDishList
                            dishes={category.dishes}
                            loadingStore={productStore.loadingState}
                            renderDeleleButton={(dishId: number) => (
                                <RemoveButton
                                    className={clsx()}
                                    onClick={(() => {
                                        category.removeDish(dishId)
                                        updateCalculations()
                                    })}
                                    size='small'
                                    color='gray'
                                />
                            )}
                        >
                        </DayCategoryDishList>
                    </DayCategory>
                )
            })}
        </AnimatePresence>
    )
}

export default observer(DayCategories)