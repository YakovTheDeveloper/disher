import { Typography } from '@/components/ui/Typography/Typography'
import { rootDayStore } from '@/store/rootStore'
import { DayCategory } from '@/types/day/day'
import { observer } from 'mobx-react-lite'
import React from 'react'
import TickIcon from "@/assets/icons/tick.svg";


type Props = {
    dishId: string
    isDishInCategory: (category: DayCategory, dishId: string) => boolean
}

const DishInCategoryStatus = ({ isDishInCategory, dishId }: Props) => {
    const { currentStore } = rootDayStore
    if (!currentStore || !currentStore.currentCategory) return
    const isActive = isDishInCategory(currentStore.currentCategory, dishId)
    if (!isActive) return null

    console.log('wf', currentStore?.categories)
    return (
        <Typography variant='caption' align='right' color='green'>
            в списке <TickIcon />
        </Typography>
    )
}

export default observer(DishInCategoryStatus)