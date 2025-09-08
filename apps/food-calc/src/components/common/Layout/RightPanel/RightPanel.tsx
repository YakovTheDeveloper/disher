import React from 'react'
import s from './RightPanel.module.css'
import Button from '@/components/ui/Button/Button'
import { observer } from 'mobx-react-lite'

type Props = {
    children: React.ReactNode
    topElement: React.ReactNode
    onBack: VoidFunction
}

const RightPanel = ({ children, topElement, onBack }: Props) => {
    return (
        <div className={s.panel}>
            {topElement && (
                <div className={s.top}>
                    <header>
                        <Button onClick={onBack} variant='ghost' className={s.backButton}>{'←'}</Button>
                    </header>
                    {topElement}
                </div>
            )}
            {children}
        </div>
    )
}

export default observer(RightPanel)