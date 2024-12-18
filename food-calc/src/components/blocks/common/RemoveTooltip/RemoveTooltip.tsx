import { Typography } from '@/components/ui/Typography/Typography'
import React from 'react'
import s from './RemoveTooltip.module.css'
import { Tooltip, TooltipContent, TooltipInner, TooltipTrigger, useTooltip, useTooltipContext } from '@/components/ui/Tooltip/Tooltip'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import Button from '@/components/ui/Button/Button'

type Props = {
    removableName?: string
    onConfirm: VoidFunction
    children: React.ReactNode
}

const RemoveTooltip = ({ removableName, onConfirm, children }: Props) => {

    const nameView = removableName ? ` ${removableName}` : ''

    const { setOpen } = useTooltipContext()

    const confirmHandle = () => {
        onConfirm()
        setOpen(false)
    }

    const rejectHandle = () => {
        setOpen(false)
    }

    return (
        <>
            <TooltipTrigger
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </TooltipTrigger>
            <TooltipContent className="Tooltip"
                onClick={(e) => e.stopPropagation()}
            >
                <TooltipInner>
                    {/* <Typography variant='body1'>Удалить{nameView}?</Typography> */}
                    <Button className={s.confirmButton} onClick={confirmHandle} variant='secondary'>Подтвердить</Button>
                    {/* <button onClick={rejectHandle}>нет</button> */}
                </TooltipInner>
            </TooltipContent>
        </>




    )
}

export default RemoveTooltip