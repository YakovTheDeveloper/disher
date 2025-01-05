import { ProductPortion } from '@/types/product/product'
import React from 'react'
import s from './DishPortions.module.css'
import { Typography } from '@/components/ui/Typography/Typography'
import clsx from 'clsx'

type Props = {
    portions: Omit<ProductPortion, 'id'>[]
    currentQuantity: number
    onClick: (quantity: number) => void
}

const DishPortions = ({ portions, currentQuantity, onClick }: Props) => {
    return (
        <ul className={s.dishPortions}>
            {portions.map(({ name, quantity }) => (
                <li onClick={() => onClick(quantity)}
                    className={clsx([s.dishPortion, currentQuantity === quantity && s.active])}
                >
                    {name}
                </li>
            ))}</ul>
    )
}

export default DishPortions