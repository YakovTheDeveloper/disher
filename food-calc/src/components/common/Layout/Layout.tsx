import React from 'react'
import s from './Layout.module.css'
import Container from '@/components/ui/Container/Container'
import { observer } from 'mobx-react-lite'
import clsx from 'clsx'

type Props = {
    left: React.ReactNode
    center: React.ReactNode
    right: React.ReactNode
    overlayCenter?: boolean
}

const Layout = ({ left, center, right, overlayCenter }: Props) => {
    return (
        <section className={s.layout}>
            <Container className={s.left}>
                {left}
            </Container>
            <Container
                boxShadow size='medium'
                className={clsx([s.center, overlayCenter && s.overlayCenter])}
            >
                {center}
            </Container>
            {right && <Container className={s.right}>
                {right}
            </Container>}
        </section>
    )
}

export default observer(Layout)