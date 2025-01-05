import Button from '@/components/ui/Button/Button'
import React from 'react'
import s from './ProductsPortions.module.css'
import { ProductPortion } from '@/types/product/product'
import { ProductPortionStore, ProductStore } from '@/store/productStore/rootProductStore'
import InputNumber from '@/components/ui/Input/InputNumber'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { observer } from 'mobx-react-lite'
import Input from '@/components/ui/Input/Input'

type Props = {
    portions: ProductPortionStore[]
    addPortion: () => void
    removePortion: (portionId: number) => void
}

const ProductsPortions = ({ portions, addPortion, removePortion }: Props) => {
    return (
        <div className={s.productsPortions}>
            <Button variant='secondary' onClick={addPortion}>Добавить порцию</Button>
            <ul className={s.productsPortionsList}>
                {portions.map(({ id, name, quantity, updateName, updateQuantity }) => (
                    <li
                        key={id}
                        className={s.portion}
                    >
                        <Input value={name} onChange={(e) => updateName(e.target.value)} />
                        <InputNumber value={quantity} onChange={(value) => updateQuantity(value)} />
                        <RemoveButton onClick={() => removePortion(id)} size='small' />
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default observer(ProductsPortions)