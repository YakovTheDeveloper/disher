import { Typography } from '@/components/ui/Typography/Typography'
import { rootDayStore } from '@/store/rootStore'
import { DayCategory } from '@/types/day/day'
import { observer } from 'mobx-react-lite'
import React from 'react'
import TickIcon from "@/assets/icons/tick.svg";
import s from './DishInCategoryStatus.module.css'

type Props = {
    isDishInCategory: boolean
}

const DishInCategoryStatus = ({ isDishInCategory }: Props) => {

    const isActive = isDishInCategory
    if (!isActive) return null

    return (
        <Typography variant='caption' align='right' color='green' className={s.dishInCategoryStatus}>
            <TickIcon />
        </Typography>
    )
}

export default observer(DishInCategoryStatus)