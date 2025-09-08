import Button from '@/components/ui/Button/Button'
import React from 'react'
import s from './ProductsPortions.module.css'
import { ProductPortion } from '@/types/product/product'
import { PortionStore, ProductStore } from '@/store/productStore/rootProductStore'
import InputNumber from '@/components/ui/Input/InputNumber'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { observer } from 'mobx-react-lite'
import Input from '@/components/ui/Input/Input'
import clsx from 'clsx'
import { Typography } from '@/components/ui/Typography/Typography'
import { TOTAL_PRODUCTS_PORTION_ID } from '@/constants'
import { Portion } from '@/types/common/common'

type Props = {
    portions: PortionStore[]
    addPortion: (portion?: Portion) => void
    removePortion: (portionId: number) => void
    className?: string
    disabledPortionIds?: number[]
}

const ProductsPortions = ({ portions, addPortion, removePortion, className, disabledPortionIds = [TOTAL_PRODUCTS_PORTION_ID] }: Props) => {
    return (
        <section className={s.portionsContainer}>
            <Button variant='secondary' onClick={() => addPortion()}>Добавить порцию</Button>
            <div className={clsx([s.productsPortions])}>
                <ul className={clsx([s.productsPortionsList, className])}>
                    {portions.map(({ id, name, quantity, updateName, updateQuantity }) => {
                        const disabled = disabledPortionIds.includes(id)

                        if (disabled) {
                            return (
                                <li
                                    key={id}
                                    className={s.portion}
                                >
                                    <Typography align='center' variant='h2'>
                                        {quantity} гр -
                                        {name}
                                    </Typography>
                                </li>
                            )
                        }

                        return (
                            <li
                                key={id}
                                className={s.portion}
                            >

                                <Input className={s.portionNameInput} value={name} onChange={(e) => updateName(e.target.value)} size='small' />
                                <InputNumber
                                    className={s.portionQuantityInput}
                                    value={quantity}
                                    onChange={updateQuantity}
                                    label={<Typography variant='caption'>гр.</Typography>}
                                />

                                <RemoveButton className={s.removeButton} onClick={() => removePortion(id)} size='small' />
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}

export default observer(ProductsPortions)