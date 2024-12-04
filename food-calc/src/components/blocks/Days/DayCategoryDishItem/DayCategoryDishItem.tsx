import { DayCategoryDish } from '@/types/day/day'
import React, { useCallback } from 'react'
import s from './DayCategoryDishItem.module.css'
import { Typography } from '@/components/ui/Typography/Typography'
import clsx from 'clsx'
import Slider from '@/components/ui/Slider/Slider'

type Props = {
    dish: DayCategoryDish
    children: React.ReactNode
    after: React.ReactNode
    className: string
}

const DayCategoryDishItem = ({ dish, children, className, after }: Props) => {



    const { id, name } = dish
    return (
        <li key={id} className={clsx([className, s.dish])}>
            <div className={s.dishName}>
                <Typography variant='body1'>{name}</Typography>
                {after && <div>{after}</div>}
            </div>
            {children}
        </li>
    )
}

export default DayCategoryDishItem