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
import ChoiceComponent, { ChoiceOption } from '@/components/ui/Choice/Choice'
import { observer } from 'mobx-react-lite'
import DishQuantity from '@/components/blocks/Days/DayCategoryDish/DishQuantity/DishQuantity'

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

    const handleChoice = ({ value }: ChoiceOption) => {
        setIsOriginalValuesUseUsed(value === 'portion')
    }

    return (
        <li key={id} className={clsx([className, s.dish])}>
            <div className={s.dishName}>
                <div>
                    {/* {!isOriginalValuesUse && <QuantityControl
                        quantity={dish.quantity}
                        onChange={onUpdateQuantity}
                        sliderClassName={s.slider}
                    />} */}
                    <DishQuantity
                        quantity={dish.quantity}
                        onChange={onUpdateQuantity}
                    />
                    {/* <ChoiceComponent
                        className={s.choice}
                        active={isOriginalValuesUse ? 'portion' : 'different'}
                        options={[
                            { displayName: 'Другое значение', value: 'different' },
                            { displayName: 'Порция', value: 'portion' },
                        ]}
                        onChoose={handleChoice}
                    /> */}
                </div>
                <Typography variant='body1'>
                    {name}
                </Typography>
                <RemoveButton
                    className={s.removeButton}
                    onClick={onRemove}
                    size='small'
                    color='gray'
                />
            </div>


            <Overlay show={isLoading} />
        </li>
    )
}

export default observer(DayCategoryDish)