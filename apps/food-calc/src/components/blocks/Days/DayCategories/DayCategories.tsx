import DayCategory from '@/components/blocks/Days/DayCategory/DayCategory'
import DayCategoryDishList from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayCategoryDishList'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { DayCalculationContext } from '@/context/calculationContext'

import { DayCategoryStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryStore'
import { DayStore2 } from '@/store/rootDayStore/dayStore2'
import { productStore, rootProductStore } from '@/store/rootStore'
import clsx from 'clsx'
import { Reorder, AnimatePresence } from 'framer-motion'
import { observable } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useContext } from 'react'

type Props = {
    store: {
        categories: DayCategoryStore[]
        currentCategoryId: number
        id: number
        reorderCategories(newOrder: DayCategoryStore[]): void
    }
}
const DayCategories = ({ store }: Props) => {

    const { updateCalculations } = useContext(DayCalculationContext);

    const { categories, currentCategoryId, id, reorderCategories } = store

    return (
        <AnimatePresence>
            <Reorder.Group
                key={id}
                axis="y"
                values={categories}
                onReorder={(newOrder) => {
                    reorderCategories(newOrder)
                }}
            >
                {categories.map((category, index) => {
                    return (
                        <DayCategory
                            key={category.id}
                            isActive={currentCategoryId === category.id}
                            category={category}
                            index={index}
                            // renderDragHandle={true}
                            removeCategory={category.remove}
                        >
                            <DayCategoryDishList
                                dishes={category.dishes}
                                removeDish={category.removeDish}
                                loadingStore={rootProductStore.loadingState}
                            >
                            </DayCategoryDishList>
                        </DayCategory>
                    )
                })}
            </Reorder.Group>
        </AnimatePresence>
    )
}

export default observer(DayCategories)