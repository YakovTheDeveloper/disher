import DayCategory from '@/components/blocks/Days/DayCategory/DayCategory'
import DayCategoryDishList from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayCategoryDishList'
import DayDishCoefficientSlider from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayDishCoefficientSlider/DayDishCoefficientSlider'
import DayCategoryDishItem from '@/components/blocks/Days/DayCategoryDishItem/DayCategoryDishItem'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'

import { DayCategoryStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryStore'
import clsx from 'clsx'
import { Reorder, AnimatePresence } from 'framer-motion'
import { observable } from 'mobx'
import { observer } from 'mobx-react-lite'
import React from 'react'

type Props = {
    categories: DayCategoryStore[]
    currentCategory: number

}
const DayCategories = ({ categories, currentCategory }: Props) => {
    return (
        <AnimatePresence>
            {categories.map((category, index) => (
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
                        renderDeleleButton={(dishId: number) => (
                            <RemoveButton
                                className={clsx()}
                                onClick={(() => category.removeDish(dishId))}
                                size='small'
                            />
                        )}
                    >
                    </DayCategoryDishList>
                </DayCategory>
            ))}
        </AnimatePresence>
    )
}

export default observer(DayCategories)