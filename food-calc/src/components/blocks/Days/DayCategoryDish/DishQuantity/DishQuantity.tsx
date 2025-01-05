import ChoiceComponent, { ChoiceOption } from '@/components/ui/Choice/Choice'
import React, { useCallback, useEffect, useState } from 'react'
import s from './DishQuantity.module.css'
import { Tooltip, TooltipContent, TooltipInner, TooltipTrigger } from '@/components/ui/Tooltip/Tooltip'
import InputNumber from '@/components/ui/Input/InputNumber'
import { Typography } from '@/components/ui/Typography/Typography'
import { debounce } from '@/utils/debounce'

type Props = {
    quantity: number
    onChange: (value: number) => void
}

const PORTION_SIZE = 100

const DishQuantity = ({ quantity, onChange }: Props) => {
    const [portions, setPortions] = useState(false)

    const debouncedSetPortions = useCallback(
        debounce((newValue) => setPortions(newValue), 250), []
    );

    useEffect(() => {
        const shouldSetPortions = (quantity % PORTION_SIZE) === 0;
        debouncedSetPortions(shouldSetPortions);
    }, [quantity, debouncedSetPortions]);

    const handleChoice = ({ value }: ChoiceOption) => {
        if ((quantity % PORTION_SIZE) !== 0) {
            onChange(100)
        }
        setPortions(value === 'portion')
    }

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Tooltip isHover placement='bottom-start' >
                <TooltipTrigger>
                    <span className={s.inputContainer}>
                        {
                            portions
                                ? <>
                                    <InputNumber
                                        className={s.portionInput}
                                        value={quantity / 100}
                                        onChange={(value) => onChange(PORTION_SIZE * value)}
                                        max={5}
                                        step={1}
                                    />
                                    <Typography variant='caption'>порция</Typography>
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
                        active={portions ? 'portion' : 'different'}
                        options={[
                            { displayName: 'Граммы', value: 'different' },
                            { displayName: 'Порция', value: 'portion' },
                        ]}
                        onChoose={handleChoice}
                    />
                </TooltipContent>

            </Tooltip>
        </div>
    )
}

export default DishQuantity