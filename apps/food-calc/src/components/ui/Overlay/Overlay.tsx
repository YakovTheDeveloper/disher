import React from 'react'
import s from './Overlay.module.css'
type Props = {
    children?: React.ReactNode
    show: boolean
}
const Overlay = ({ children, show }: Props) => {
    if (!show) return null
    return (
        <div className={s.overlay}>
            <div className={s.children}>{children}</div>
        </div>
    )
}

export default Overlay