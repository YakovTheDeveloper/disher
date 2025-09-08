import ChoiceComponent, { ChoiceOption } from '@/components/ui/Choice/Choice'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import s from './DishQuantity.module.css'
import { Tooltip, TooltipContent, TooltipInner, TooltipTrigger } from '@/components/ui/Tooltip/Tooltip'
import InputNumber from '@/components/ui/Input/InputNumber'
import { Typography } from '@/components/ui/Typography/Typography'
import { debounce } from '@/utils/debounce'
import { PortionStore } from '@/store/productStore/rootProductStore'
import { observer } from 'mobx-react-lite'
import { Portion } from '@/types/common/common'

type Props = {
    quantity: number
    onChange: (value: number) => void
    portions: Portion[]
}

const PORTION_SIZE = 100

const DishQuantity = ({ quantity, onChange, portions }: Props) => {
    const [currentPortion, setCurrentPortion] = useState<Portion | null>(null)

    const debouncedsetPortionVariant = useCallback(
        debounce((newValue) => setCurrentPortion(newValue), 250), []
    );

    useEffect(() => {
        console.log("quantityquantity", quantity)
        const portion = portions.find((portion) => portion.quantity === quantity)
        if (portion) {
            debouncedsetPortionVariant(portion)
        }
        // const shouldsetPortionVariant = (quantity % PORTION_SIZE) === 0;
        // debouncedsetPortionVariant(shouldsetPortionVariant);



    }, [quantity, debouncedsetPortionVariant]);

    const handleChoice = ({ value }: ChoiceOption) => {

        const portion = portions.find(({ quantity }) => quantity === value)
        console.log("quantityquantity", portion)
        if (portion) {
            onChange(portion.quantity)
            return
        }

        if (value === -1) {
            setCurrentPortion(null)
        }

        onChange(100)

        // if ((quantity % PORTION_SIZE) !== 0) {
        //     onChange(100)
        // }
        // setPortionVariant(value === 'portion')
    }

    const choiceOptions = useMemo(() => ([
        { displayName: 'Граммы', value: -1 },
        ...portions.map(({ name, quantity }) => ({
            displayName: name,
            value: quantity,
        }))
    ]), portions)


    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Tooltip isHover placement='bottom-start' >
                <TooltipTrigger>
                    <span className={s.inputContainer}>
                        {
                            currentPortion
                                ? <>
                                    <InputNumber
                                        className={s.portionInput}
                                        value={quantity / 100}
                                        onChange={(value) => onChange(currentPortion.quantity * value)}
                                        max={5}
                                        step={1}
                                    />
                                    <Typography variant='caption'>{currentPortion.name}</Typography>
                                </>
                                : <>
                                    <InputNumber value={quantity} onChange={(value) => onChange(value)} />
                                    <Typography variant='caption'>гр.</Typography>
                                </>
                        }
                    </span>


                </TooltipTrigger>
                <TooltipContent>
                    <ChoiceComponent
                        className={s.choice}
                        layout='vertical'
                        active={quantity}
                        options={choiceOptions}
                        onChoose={handleChoice}
                    />
                </TooltipContent>

            </Tooltip>
        </div>
    )
}

export default observer(DishQuantity)