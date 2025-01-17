import RemoveTooltip from '@/components/blocks/common/RemoveTooltip/RemoveTooltip'
import Button from '@/components/ui/Button/Button'
import InputNumber from '@/components/ui/Input/InputNumber'
import { TooltipTrigger, TooltipContent, TooltipInner, Tooltip, useTooltipContext } from '@/components/ui/Tooltip/Tooltip'
import { Typography } from '@/components/ui/Typography/Typography'
import { DishStore } from '@/store/rootDishStore/dishStore/dishStore'
import { div, s } from 'framer-motion/client'
import { observer } from 'mobx-react-lite'
import React, { useState } from 'react'

type Props = {
    dishStore: DishStore
}
const DishDivideSettings = ({ dishStore }: Props) => {

    const { divideAllProducts, empty } = dishStore

    const [portionChanged, setPortionChanged] = useState(false)
    const [recipePortionCount, setRecipePorionCount] = useState(1)


    const confirmDivide = () => {
        divideAllProducts(recipePortionCount)
        setRecipePorionCount(1)
        setPortionChanged(false)
    }


    const onRecipeCountChange = (value: number) => {
        setRecipePorionCount(value)
        setPortionChanged(true)
    }
    return (
        <div>
            <div>
                <Typography variant='caption' align='center'>Изменение общего веса</Typography>
                <Tooltip isHover>
                    <TooltipTrigger
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span>
                            (?)
                        </span>
                    </TooltipTrigger>
                    <TooltipContent className="Tooltip"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <TooltipInner>
                            <Typography variant='caption' align='center'>
                                В случае, если рецепт блюда рассчитан в порциях,
                                с помощью этой настройки можно перевести вес блюда в граммах на одну порцию.
                            </Typography>
                        </TooltipInner>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div>


                {!empty && <div>
                    <div>
                        <InputNumber
                            max={30}
                            step={1}
                            value={recipePortionCount}
                            onChange={onRecipeCountChange}
                            label={
                                <Typography variant='caption' align='center'>Порций в рецепте</Typography>
                            } />
                    </div>
                    {portionChanged && (
                        <Tooltip isClick >
                            <RemoveTooltip onConfirm={confirmDivide} message={
                                <>
                                    <Typography align='center'>
                                        Будет выполнен пропорциональный перевод граммов с {recipePortionCount} порц. на одну порц.
                                    </Typography>
                                </>
                            }>
                                <Button variant='ghost'>
                                    Применить
                                </Button>
                            </RemoveTooltip>
                        </Tooltip>
                    )}

                </div>}

            </div>
        </div>
    )
}

export default observer(DishDivideSettings)