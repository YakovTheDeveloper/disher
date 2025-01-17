import { Typography } from '@/components/ui/Typography/Typography'
import React from 'react'
import s from './RemoveTooltip.module.css'
import { Tooltip, TooltipContent, TooltipInner, TooltipTrigger, useTooltip, useTooltipContext } from '@/components/ui/Tooltip/Tooltip'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import Button from '@/components/ui/Button/Button'

type Props = {
    removableName?: string
    className?: string
    onConfirm: VoidFunction
    children: React.ReactNode
    message?: React.ReactNode
}

//todo rename - ConfirmTooltip

const RemoveTooltip = ({ removableName, onConfirm, children, className, message }: Props) => {

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
                    {message}
                    {/* <Typography variant='body1'>Удалить{nameView}?</Typography> */}
                    <Button className={s.confirmButton} onClick={confirmHandle} variant='secondary'>
                        <Typography variant='body2'>
                            Подтвердить
                        </Typography>
                    </Button>
                    {/* <button onClick={rejectHandle}>нет</button> */}
                </TooltipInner>
            </TooltipContent>
        </>




    )
}

export default RemoveTooltip