import { UserDishStore } from '@/store/rootDishStore/dishStore/dishStore'
import React, { useEffect } from 'react'
import s from './DayDishesList.module.css'
import { DayCategory, DayCategoryDish } from '@/types/day/day'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import DishInCategoryStatus from '@/components/blocks/Days/DayCategoryDish/DishInCategoryStatus/DishInCategoryStatus'
import { Typography } from '@/components/ui/Typography/Typography'
import { Tooltip, TooltipContent, TooltipInner, TooltipTrigger } from '@/components/ui/Tooltip/Tooltip'
import SelectableItem from '@/components/ui/SelectableItem/SelectableItem'

type Props = {
    userDishes: UserDishStore[]
    isDishInCategory: (dishId: number) => boolean
    toggleDishInCategory: (dish: DayCategoryDish) => void
    category: DayCategory
}

const DayDishesList = ({ userDishes, isDishInCategory, toggleDishInCategory }: Props) => {

    return (
        <ul className={s.dayDishesList}>
            {userDishes.map((dish) => {
                const isActive = isDishInCategory(dish.id)
                return (
                    <Tooltip isHover placement='left'>
                        <TooltipTrigger>
                            <SelectableItem
                                isActive={isActive}
                                onClick={() => toggleDishInCategory({
                                    quantity: 100,
                                    id: dish.id,
                                    name: dish.name,
                                    products: dish.products.map(({ id, quantity }) => ({ id: +id, quantity }))
                                })}
                            >
                                <Typography>{dish.name}</Typography>

                            </SelectableItem>
                        </TooltipTrigger>
                        <TooltipContent>
                            <TooltipInner size='small' variant='simple'>
                                {isActive ? 'Клик, чтобы убрать блюдо' : 'Клик, чтобы добавить блюдо'}
                            </TooltipInner>
                        </TooltipContent>
                    </Tooltip>

                )
            })}
        </ul>
    )
}

export default observer(DayDishesList)