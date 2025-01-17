import React from 'react'
import s from './SelectableItem.module.css'
import DishInCategoryStatus from '@/components/blocks/Days/DayCategoryDish/DishInCategoryStatus/DishInCategoryStatus'
import { Typography } from '@/components/ui/Typography/Typography'
import clsx from 'clsx'

const SelectableItem = ({ isActive, onClick, children }) => {
    return (
        <li
            onClick={onClick}
            className={clsx([s.selectableItem, isActive && s.selectableItemActive])}
        >
            {children}
            <DishInCategoryStatus
                className={s.statusIndicator}
                isActive={isActive}
            />
        </li>
    )
}

export default SelectableItem