import { Typography } from '@/components/ui/Typography/Typography'
import { rootDayStore } from '@/store/rootStore'
import { DayCategory } from '@/types/day/day'
import { observer } from 'mobx-react-lite'
import React from 'react'
import TickIcon from "@/assets/icons/tick.svg";
import s from './DishInCategoryStatus.module.css'
import clsx from 'clsx'

type Props = {
    isActive: boolean
    className: string
}

const DishInCategoryStatus = ({ isActive, className }: Props) => {
    return (
        <Typography
            variant='caption'
            align='right'
            className={clsx([s.dishInCategoryStatus, className, isActive && s.active])}
        >
            <TickIcon />
        </Typography>
    )
}

export default observer(DishInCategoryStatus)