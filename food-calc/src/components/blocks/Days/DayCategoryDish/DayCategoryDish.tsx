import { DayCategoryDish as DayCategoryDishType } from '@/types/day/day'
import React, { useCallback, useContext } from 'react'
import s from './DayCategoryDish.module.css'
import { Typography } from '@/components/ui/Typography/Typography'
import clsx from 'clsx'
import Slider from '@/components/ui/Slider/Slider'
import Overlay from '@/components/ui/Overlay/Overlay'
import QuantityControl from '@/components/ui/QuantityControl/QuantityControl'
import { DayCalculationContext } from '@/context/calculationContext'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'

type Props = {
    dish: DayCategoryDishType & {
        updateQuantity: (value: number) => void
    }
    className?: string
    isLoading: boolean
    removeDish: () => void
}

const DayCategoryDish = ({ dish, className, removeDish, isLoading }: Props) => {
    const { id, name, updateQuantity } = dish
    const { updateCalculations } = useContext(DayCalculationContext)

    const onUpdateQuantity = (value: number) => {
        updateQuantity(value)
        updateCalculations()
    }

    const onRemove = () => {
        removeDish()
        updateCalculations()
    }

    return (
        <li key={id} className={clsx([className, s.dish])}>
            <header className={s.dishName}>
                <Typography variant='body1'>
                    {name}
                </Typography>
                <RemoveButton
                    className={s.removeButton}
                    onClick={onRemove}
                    size='small'
                    color='gray'
                />
            </header>
            <QuantityControl
                quantity={dish.quantity}
                onChange={onUpdateQuantity}
            />
            <Overlay show={isLoading} />
        </li>
    )
}

export default DayCategoryDish