import React from 'react'
import s from './Layout.module.css'
import Container from '@/components/ui/Container/Container'

type Props = {
    left: React.ReactNode
    center: React.ReactNode
    right: React.ReactNode
}

const Layout = ({ left, center, right }: Props) => {
    return (
        <section className={s.layout}>
            <Container className={s.left}>
                {left}
            </Container>
            <Container boxShadow size='medium'>
                {center}
            </Container>
            <Container>
                {right}
            </Container>
        </section>
    )
}

export default Layout