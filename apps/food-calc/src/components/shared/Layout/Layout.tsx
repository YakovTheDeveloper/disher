import React from 'react'
import s from './Layout.module.css'
import Container from '@/components/ui/Container/Container'
import { observer } from 'mobx-react-lite'
import clsx from 'clsx'

type Props = {
    left: React.ReactNode
    center: React.ReactNode
    right?: React.ReactNode
    centerTop?: React.ReactNode
    overlayCenter?: boolean
}

const Layout = ({ left, center, right = null, centerTop, overlayCenter }: Props) => {

    const columnClass = getColumnsContainerClass({ right })

    return (
        <div className={clsx([s.layout, columnClass])}>
            <section className={s.left}>
                {left}
            </section>
            <section className={clsx([s.center, overlayCenter && s.overlayCenter])}
            >
                {center}
            </section>
            {right && <section className={s.right} >
                {right}
            </section>}
        </div>
    )
}

export default observer(Layout)

type Columns = {
    right?: React.ReactNode
}

const getColumnsContainerClass = ({ right }: Columns) => {
    if (!right) {
        return s.noRight
    }
    return ''
}