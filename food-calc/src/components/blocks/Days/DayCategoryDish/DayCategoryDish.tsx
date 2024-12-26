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
import ChoiceComponent from '@/components/ui/Choice/Choice'
import { observer } from 'mobx-react-lite'

type Props = {
    dish: DayCategoryDishType & {
        updateQuantity: (value: number) => void
        setIsOriginalValuesUseUsed: (value: boolean) => void
        isOriginalValuesUse: boolean
    }
    className?: string
    isLoading: boolean
    removeDish: () => void
}

const DayCategoryDish = ({ dish, className, removeDish, isLoading }: Props) => {
    const { id, name, updateQuantity, setIsOriginalValuesUseUsed, isOriginalValuesUse } = dish
    const { updateCalculations } = useContext(DayCalculationContext)

    const onUpdateQuantity = (value: number) => {
        updateQuantity(value)
        updateCalculations()
    }

    const onRemove = () => {
        removeDish()
        updateCalculations()
    }

    console.log("isOriginalValuesUse", isOriginalValuesUse)

    const handleChoice = (value: boolean) => {
        console.log("isOriginalValuesUse 2", value)

        setIsOriginalValuesUseUsed(value)
    }

    return (
        <li key={id} className={clsx([className, s.dish])}>
            <ChoiceComponent
                className={s.choice}
                buttonLabels={['Порция', 'Другой вес']}
                isActive={isOriginalValuesUse}
                onChoose={handleChoice}
            />
            {isOriginalValuesUse
                ? <header className={s.dishName}>
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
                : <QuantityControl
                    quantity={dish.quantity}
                    onChange={onUpdateQuantity}
                    sliderClassName={s.slider}
                >
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
                </QuantityControl>}

            <Overlay show={isLoading} />
        </li>
    )
}

export default observer(DayCategoryDish)