import Slider from '@/components/ui/Slider/Slider'
import { Typography } from '@/components/ui/Typography/Typography'
import { dayCategoryDishStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryDishStore'
import { debounce } from '@/utils/debounce'
import { observer } from 'mobx-react-lite'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import s from './QuantityControl.module.css'
import { DayCalculationContext } from '@/context/calculationContext'
import NumberInput from "@/components/ui/Input/InputNumber";

type Props = {
    quantity: number
    onChange: (value: number) => void
    children: React.ReactNode
}

// const getDescriptionLabelText = (quantity: number) => {
//     return `${(quantity * 100).toFixed(1)} гр`
// }

const QuantityControl = ({ quantity, onChange, children }: Props) => {
    const [localValue, setLocalValue] = useState(quantity)
    console.log(quantity)

    useEffect(() => {
        setLocalValue(quantity)
    }, [quantity])


    const debouncedUpdate = useCallback(
        debounce((newValue) => onChange(newValue), 300), []
    )

    const handleChange = (value: number) => {
        setLocalValue(value) // Update UI immediately
        debouncedUpdate(value) // Debounced heavy operation
    }

    return (
        <div className={s.quantityControl}>

            <div className={s.quantityControlHeader}>
                <NumberInput
                    value={localValue}
                    onChange={handleChange}
                />
                {children}
            </div>
            <Slider
                min={0}
                max={400}
                step={10}
                className={s.quantityControlSlider}
                onChange={handleChange}
                value={localValue}
            />
        </div>
    )
}

export default observer(QuantityControl)
