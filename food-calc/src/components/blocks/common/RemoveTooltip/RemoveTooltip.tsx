import { Typography } from '@/components/ui/Typography/Typography'
import React from 'react'
import s from './RemoveTooltip.module.css'
import { Tooltip, TooltipContent, TooltipInner, TooltipTrigger, useTooltip, useTooltipContext } from '@/components/ui/Tooltip/Tooltip'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'

type Props = {
    removableName?: string
    onConfirm: () => Promise<void>
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
            <TooltipTrigger >
                {children}
            </TooltipTrigger>
            <TooltipContent className="Tooltip">
                <TooltipInner>
                    <Typography variant='body2'>Удалить{nameView}?</Typography>
                    <button onClick={confirmHandle}>да</button>
                    {/* <button onClick={rejectHandle}>нет</button> */}
                </TooltipInner>
            </TooltipContent>
        </>


    )
}

export default RemoveTooltip